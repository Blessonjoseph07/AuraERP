import React, { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Plus, DollarSign, Wallet, ClipboardList, Trash2, PieChart, X } from 'lucide-react'

const Finance = () => {
  const { isAdmin } = useAuth()

  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    category: 'Rent',
    amount: '',
    description: '',
  })

  const loadFinanceData = async () => {
    try {
      const res = await api.get('/api/finance/')
      setExpenses(res.data)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch finance records. Verify access level permissions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFinanceData()
  }, [])

  const handleOpenAddModal = () => {
    setFormData({
      category: 'Rent',
      amount: '',
      description: '',
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense log?')) return
    try {
      await api.delete(`/api/finance/${id}`)
      setExpenses(expenses.filter(e => e.id !== id))
    } catch (err) {
      console.error(err)
      alert('Failed to delete expense record.')
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description || null
      }
      const res = await api.post('/api/finance/', payload)
      setExpenses([res.data, ...expenses])
      setIsModalOpen(false)
    } catch (err) {
      console.error(err)
      alert('Failed to log expenditure.')
    }
  }

  // Group expenses by category
  const getCategoryAggregates = () => {
    const categories = {}
    expenses.forEach((e) => {
      categories[e.category] = (categories[e.category] || 0) + e.amount
    })
    return Object.keys(categories).map(cat => ({
      name: cat,
      total: categories[cat]
    })).sort((a,b) => b.total - a.total)
  }

  const categoryData = getCategoryAggregates()
  const totalExpenditure = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Operations Costs</span>
            <h3 className="text-2xl font-extrabold text-rose-400">₹{totalExpenditure.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            <p className="text-[9px] text-slate-500">Cumulative expense entries logged</p>
          </div>
          <div className="p-3.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl">
            <Wallet size={20} />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Claims Logged</span>
            <h3 className="text-2xl font-extrabold text-slate-200">{expenses.length} claims</h3>
            <p className="text-[9px] text-slate-500">Active records in database ledger</p>
          </div>
          <div className="p-3.5 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-xl">
            <ClipboardList size={20} />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Largest Spend Category</span>
            <h3 className="text-2xl font-extrabold text-slate-200">{categoryData[0]?.name || 'None'}</h3>
            <p className="text-[9px] text-slate-500">Totaling: ₹{categoryData[0]?.total.toFixed(2) || '0.00'}</p>
          </div>
          <div className="p-3.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
            <PieChart size={20} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Expenses List Table (takes 2 cols) */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Expense History Ledger</h3>
              <p className="text-[10px] text-slate-400">Statement breakdown of recorded spending claims</p>
            </div>
            
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <Plus size={14} />
              <span>Log Expense</span>
            </button>
          </div>

          {loading ? (
            <div className="flex py-12 justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-xs text-red-400">{error}</div>
          ) : expenses.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">No expense claims logged.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2">
                    <th className="py-3 px-4">Claim ID</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Date</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Delete</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-800/10 transition">
                      <td className="py-3.5 px-4 text-slate-500 font-mono">#EXP-{e.id}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] text-slate-300 category-badge">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-rose-400">₹{e.amount.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">{e.description || 'No description'}</td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">{new Date(e.expense_date).toLocaleDateString()}</td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDelete(e.id)}
                            className="p-1 text-slate-500 hover:text-red-400 rounded transition"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Expenses by Category breakdown widgets */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5 h-fit">
          <div className="flex items-center gap-2 text-rose-400">
            <PieChart size={18} />
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Costs Center Analysis</h3>
          </div>
          <p className="text-[10px] text-slate-400">Accumulated operating costs categorized by division spend:</p>
          
          <div className="space-y-4">
            {loading ? (
              <div className="flex py-6 justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
              </div>
            ) : categoryData.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">No category claims documented.</div>
            ) : (
              categoryData.map((c, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-200">{c.name}</span>
                    <span className="text-rose-400">₹{c.total.toFixed(2)}</span>
                  </div>
                  {/* Progress Bar indicating cost weight */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-rose-600 to-rose-400 h-full rounded-full"
                      style={{ 
                        width: `${(c.total / (totalExpenditure || 1)) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-[9px] text-slate-400 text-right">
                    {((c.total / (totalExpenditure || 1)) * 100).toFixed(1)}% of total operations
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Log Expense Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card w-full max-w-sm rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <DollarSign size={16} className="text-brand-400" />
                Log Business Expenditure
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Expense Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-brand-500 cursor-pointer"
                >
                  <option value="Rent">Rent & Space Lease</option>
                  <option value="Cloud Services">Cloud & SaaS Hosting</option>
                  <option value="Office Supplies">Office Furniture & Supplies</option>
                  <option value="Marketing">Marketing & Advertising</option>
                  <option value="Utilities">Electricity & Web Utilities</option>
                  <option value="Travel">Travel & Lodging</option>
                  <option value="Other">Other Miscellaneous</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Amount Cost (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-brand-500 h-20 resize-none"
                  placeholder="Details of spend claim..."
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-semibold rounded-xl shadow-lg transition"
                >
                  Post Expenditure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Finance
