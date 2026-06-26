import React, { useState, useRef, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { 
  Bot, 
  Send, 
  Database, 
  FileText, 
  Upload, 
  FileCheck, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Download,
  AlertCircle
} from 'lucide-react'

// Basic Markdown renderer helper since we aren't using heavy dependencies
const simpleMarkdown = (text) => {
  if (!text) return ''
  
  const lines = text.split('\n')
  let inTable = false
  let tableHeader = true
  let htmlResult = []
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()
    
    // Check if line is a table row
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true
        tableHeader = true
        htmlResult.push('<div class="overflow-x-auto my-3"><table class="w-full text-left text-[11px] border-collapse border border-slate-800 rounded-lg overflow-hidden">')
      }
      
      // Skip separator line |---|---|
      if (line.match(/^\|[\s\-\|]+$/)) {
        tableHeader = false
        continue
      }
      
      // Parse cells
      const cells = line.split('|').slice(1, -1).map(c => c.trim())
      htmlResult.push('<tr class="border-b border-slate-800/80 hover:bg-slate-800/10 transition">')
      for (const cell of cells) {
        if (tableHeader) {
          htmlResult.push(`<th class="py-2 px-3 bg-slate-900 font-bold text-slate-300 border-r border-slate-850">${cell}</th>`)
        } else {
          htmlResult.push(`<td class="py-2 px-3 text-slate-300 border-r border-slate-850 font-medium">${cell}</td>`)
        }
      }
      htmlResult.push('</tr>')
      continue
    } else {
      if (inTable) {
        inTable = false
        htmlResult.push('</table></div>')
      }
    }
    
    // Process standard markdown line
    let processedLine = line
    let isBlock = false
    
    // Headers
    if (processedLine.startsWith('### ')) {
      processedLine = `<h4 class="text-sm font-bold text-slate-200 mt-3 mb-1">${processedLine.slice(4)}</h4>`
      isBlock = true
    } else if (processedLine.startsWith('## ')) {
      processedLine = `<h3 class="text-base font-bold text-slate-100 mt-4 mb-2 border-b border-slate-800 pb-1">${processedLine.slice(3)}</h3>`
      isBlock = true
    } else if (processedLine.startsWith('# ')) {
      processedLine = `<h2 class="text-lg font-extrabold text-brand-300 mt-5 mb-3">${processedLine.slice(2)}</h2>`
      isBlock = true
    } else if (processedLine.startsWith('- ') || processedLine.startsWith('* ')) {
      processedLine = `<li class="ml-4 list-disc text-slate-300">${processedLine.slice(2)}</li>`
      isBlock = true
    }
    
    // Bold formatting
    processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100">$1</strong>')
    // Italic formatting
    processedLine = processedLine.replace(/\*(.*?)\*/g, '<em class="italic text-slate-400">$1</em>')
    
    if (isBlock) {
      htmlResult.push(processedLine)
    } else {
      htmlResult.push(processedLine + '<br />')
    }
  }
  
  if (inTable) {
    htmlResult.push('</table></div>')
  }
  
  return htmlResult.join('\n')
}

const AIAssistant = () => {
  const { isManager } = useAuth()
  const [activeTab, setActiveTab] = useState('db-chat')

  // --- ERP DB Chat State ---
  const [dbMessages, setDbMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your AuraERP Data Analyst. Ask me anything about inventory, sales transactions, employees, or expenses!' }
  ])
  const [dbInput, setDbInput] = useState('')
  const [dbLoading, setDbLoading] = useState(false)
  const [expandedSqlIdx, setExpandedSqlIdx] = useState(null)

  // --- RAG Doc QA State ---
  const [docMessages, setDocMessages] = useState([
    { role: 'assistant', content: 'Hello! Upload a company policy PDF, invoice, or guidelines document, and query its contents using RAG.' }
  ])
  const [docInput, setDocInput] = useState('')
  const [docLoading, setDocLoading] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploading, setUploading] = useState(false)

  // --- Report State ---
  const [reportType, setReportType] = useState('sales')
  const [reportOutput, setReportOutput] = useState('')
  const [reportLoading, setReportLoading] = useState(false)

  const dbEndRef = useRef(null)
  const docEndRef = useRef(null)

  // Auto scroll chat
  useEffect(() => {
    dbEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [dbMessages, dbLoading])

  useEffect(() => {
    docEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [docMessages, docLoading])

  // --- ERP DB Chat Actions ---
  const handleSendDbChat = async (e) => {
    e.preventDefault()
    if (!dbInput.trim()) return

    const userMsg = dbInput
    setDbInput('')
    setDbMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setDbLoading(true)

    try {
      const res = await api.post('/api/ai/chat', { message: userMsg })
      setDbMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.response,
        sql: res.data.generated_sql,
        results: res.data.sql_results
      }])
    } catch (err) {
      console.error(err)
      setDbMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error querying the database. Please ensure your query parameters are safe.'
      }])
    } finally {
      setDbLoading(false)
    }
  }

  // --- RAG Doc Upload and QA Actions ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0])
      setUploadStatus('')
    }
  }

  const handleUploadFile = async () => {
    if (!uploadFile) return
    setUploading(true)
    setUploadStatus('Reading and Indexing Document...')
    
    const formData = new FormData()
    formData.append('file', uploadFile)

    try {
      const res = await api.post('/api/ai/upload-doc', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      setUploadStatus(`Index Complete! Created ${res.data.chunks_indexed} document chunks in ChromaDB.`)
      setUploadFile(null)
    } catch (err) {
      console.error(err)
      setUploadStatus(err.response?.data?.detail || 'Failed to parse document. Ensure it is a valid PDF.')
    } finally {
      setUploading(false)
    }
  }

  const handleSendDocChat = async (e) => {
    e.preventDefault()
    if (!docInput.trim()) return

    const userMsg = docInput
    setDocInput('')
    setDocMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setDocLoading(true)

    try {
      const res = await api.post('/api/ai/chat-doc', { message: userMsg })
      setDocMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.response,
        sources: res.data.sources
      }])
    } catch (err) {
      console.error(err)
      setDocMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error searching document context. Ensure Gemini and Chroma are initialized.'
      }])
    } finally {
      setDocLoading(false)
    }
  }

  // --- Report Actions ---
  const handleGenerateReport = async () => {
    setReportLoading(true)
    setReportOutput('')
    try {
      const res = await api.get('/api/ai/report', {
        params: { type: reportType }
      })
      setReportOutput(res.data.summary)
    } catch (err) {
      console.error(err)
      setReportOutput('Failed to compile report. Make sure you have the Manager role and the Gemini API key is active.')
    } finally {
      setReportLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-8rem)] flex flex-col">
      {/* Workspace Tabs Header */}
      <div className="flex border-b border-slate-800 shrink-0 no-print">
        <button
          onClick={() => setActiveTab('db-chat')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition ${
            activeTab === 'db-chat'
              ? 'border-brand-500 text-brand-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database size={16} />
          <span>ERP Database Assistant</span>
        </button>

        <button
          onClick={() => setActiveTab('doc-qa')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition ${
            activeTab === 'doc-qa'
              ? 'border-brand-500 text-brand-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText size={16} />
          <span>Document QA (RAG)</span>
        </button>

        {isManager && (
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-xs uppercase tracking-wider transition ${
              activeTab === 'reports'
                ? 'border-brand-500 text-brand-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles size={16} />
            <span>Executive Summaries</span>
          </button>
        )}
      </div>

      {/* Workspace Body - Tab Contents */}
      <div className="flex-1 min-h-0 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col relative">
        
        {/* TAB 1: ERP Chatbot Assistant */}
        {activeTab === 'db-chat' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Scrollable messages container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {dbMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-pop-in`}>
                  <div className={`max-w-xl rounded-2xl p-4 space-y-2 border text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-600/20 text-slate-100 border-brand-500/20 rounded-tr-none'
                      : 'bg-slate-800/40 text-slate-200 border-slate-800 rounded-tl-none'
                  }`}>
                    {/* Role header for assistant */}
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1.5 text-brand-400 font-bold tracking-wider uppercase text-[9px] mb-1">
                        <Bot size={12} />
                        <span>AuraERP AI Agent</span>
                      </div>
                    )}
                    <div className="space-y-1.5 break-words select-text" dangerouslySetInnerHTML={{ __html: simpleMarkdown(msg.content) }} />

                    {/* SQL query toggle helper */}
                    {msg.sql && (
                      <div className="pt-2 border-t border-slate-850 mt-2 space-y-1">
                        <button
                          onClick={() => setExpandedSqlIdx(expandedSqlIdx === idx ? null : idx)}
                          className="flex items-center gap-1 text-[10px] font-bold text-brand-400 hover:text-brand-300 transition"
                        >
                          {expandedSqlIdx === idx ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          <span>{expandedSqlIdx === idx ? 'Hide Generated SQL Query' : 'View Generated SQL Query'}</span>
                        </button>
                        
                        {expandedSqlIdx === idx && (
                          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-850 text-[10px] font-mono text-indigo-300 whitespace-pre-wrap select-all">
                            {msg.sql}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {dbLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/40 rounded-2xl rounded-tl-none p-4 border border-slate-800 flex items-center gap-2 text-xs text-slate-400">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
                    <span>AI analyst thinking...</span>
                  </div>
                </div>
              )}
              <div ref={dbEndRef} />
            </div>

            {/* Form Input footer */}
            <form onSubmit={handleSendDbChat} className="p-4 border-t border-slate-800 bg-slate-950/40 flex gap-3 shrink-0">
              <input
                type="text"
                value={dbInput}
                onChange={(e) => setDbInput(e.target.value)}
                placeholder="Ask e.g. 'Show total sales this month' or 'Show products with stock below 10'"
                className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                disabled={dbLoading || !dbInput.trim()}
                className="px-4 py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl shadow-lg disabled:opacity-50 disabled:pointer-events-none transition cursor-pointer"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: Document Intelligence (RAG) */}
        {activeTab === 'doc-qa' && (
          <div className="flex-1 flex flex-col min-h-0 md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-800">
            {/* Upload column (Left on wide screens) */}
            <div className="w-full md:w-80 p-5 shrink-0 bg-slate-950/10 flex flex-col gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Document Manager</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Upload document manuals to reference for RAG queries.</p>
              </div>

              {/* Upload Drop Zone */}
              <div className="border border-dashed border-slate-800 hover:border-brand-500/50 p-6 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition relative bg-slate-900/50">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload size={28} className="text-slate-500 mb-2" />
                <span className="text-[10px] text-slate-300 font-semibold block">
                  {uploadFile ? uploadFile.name : 'Select Company PDF'}
                </span>
                <span className="text-[9px] text-slate-500 block mt-1">PDF Files only (Max 15MB)</span>
              </div>

              {uploadFile && (
                <button
                  onClick={handleUploadFile}
                  disabled={uploading}
                  className="w-full py-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileCheck size={14} />
                  <span>{uploading ? 'Analyzing...' : 'Index Document'}</span>
                </button>
              )}

              {uploadStatus && (
                <div className={`p-3 rounded-xl border text-[10px] flex items-start gap-2 ${
                  uploadStatus.includes('Error') || uploadStatus.includes('Failed')
                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                    : 'bg-slate-900 border-slate-800 text-brand-300'
                }`}>
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{uploadStatus}</span>
                </div>
              )}
            </div>

            {/* QA Chat column (Right on wide screens) */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {docMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-pop-in`}>
                    <div className={`max-w-xl rounded-2xl p-4 space-y-2 border text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-brand-600/20 text-slate-100 border-brand-500/20 rounded-tr-none'
                        : 'bg-slate-800/40 text-slate-200 border-slate-800 rounded-tl-none'
                    }`}>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-1.5 text-brand-400 font-bold tracking-wider uppercase text-[9px] mb-1">
                          <Bot size={12} />
                          <span>Document Intelligence Agent</span>
                        </div>
                      )}
                      <div className="space-y-1.5 break-words select-text" dangerouslySetInnerHTML={{ __html: simpleMarkdown(msg.content) }} />

                      {/* Cited Sources list */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="pt-2 border-t border-slate-800 mt-2">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Cited Sources:</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {msg.sources.map((src, sIdx) => (
                              <span key={sIdx} className="px-2 py-0.5 bg-slate-900 border border-slate-850 rounded text-[9px] text-slate-400 font-mono">
                                {src}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {docLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800/40 rounded-2xl rounded-tl-none p-4 border border-slate-800 flex items-center gap-2 text-xs text-slate-400">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
                      <span>Reviewing indexed context...</span>
                    </div>
                  </div>
                )}
                <div ref={docEndRef} />
              </div>

              {/* Form Input footer */}
              <form onSubmit={handleSendDocChat} className="p-4 border-t border-slate-800 bg-slate-950/40 flex gap-3 shrink-0">
                <input
                  type="text"
                  value={docInput}
                  onChange={(e) => setDocInput(e.target.value)}
                  placeholder="Ask policy manuals e.g. 'What is the leave policy?' or 'Summarize the invoice details'"
                  className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
                <button
                  type="submit"
                  disabled={docLoading || !docInput.trim()}
                  className="px-4 py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl shadow-lg disabled:opacity-50 disabled:pointer-events-none transition cursor-pointer"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: Executive Report summaries */}
        {activeTab === 'reports' && (
          <div className="flex-1 flex flex-col min-h-0 p-6 space-y-6">
            
            {/* Top parameters block */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950/20 p-4 rounded-xl border border-slate-800 no-print">
              <div className="space-y-1 w-full sm:w-auto">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select Focus Domain</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-brand-500 w-full sm:w-56 cursor-pointer font-semibold"
                >
                  <option value="sales">Sales Performance Summaries</option>
                  <option value="expenses">Expenditures Cost Centers</option>
                  <option value="inventory">Warehouse Inventory Audits</option>
                </select>
              </div>

              <button
                onClick={handleGenerateReport}
                disabled={reportLoading}
                className="w-full sm:w-auto self-end px-5 py-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-bold rounded-xl shadow-lg transition cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {reportLoading ? 'Compiling Report...' : 'Compile Executive Report'}
              </button>
            </div>

            {/* Generated Report Display */}
            <div className="flex-1 min-h-0 bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
              {/* Header toolbars */}
              {reportOutput && (
                <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-850 flex items-center justify-between shrink-0 no-print">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Report Output Preview</span>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition font-semibold"
                  >
                    <Download size={12} />
                    <span>Print/Save PDF</span>
                  </button>
                </div>
              )}

              {/* Preview content scrollable */}
              <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-300 leading-relaxed font-sans select-text">
                {reportLoading ? (
                  <div className="flex h-48 flex-col items-center justify-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
                    <span className="text-slate-400 text-xs animate-pulse">Running database audits and formatting executive summaries...</span>
                  </div>
                ) : reportOutput ? (
                  <div 
                    className="space-y-4 max-w-3xl mx-auto printable-report"
                    dangerouslySetInnerHTML={{ __html: simpleMarkdown(reportOutput) }}
                  />
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-center space-y-1">
                    <FileText size={32} className="text-slate-600" />
                    <p className="text-xs">No report compiled yet. Click the generate button above to build an audit report.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}

export default AIAssistant
