import React, { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Plus, TrendingUp, HelpCircle, Package, ArrowUpRight, Award, Trash2, X } from 'lucide-react'

const Sales = () => {
  const { isManager, isAdmin } = useAuth()
  
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: 1,
    amount: ''
  })

  const loadPageData = async () => {
    try {
      const [salesRes, productsRes, topRes] = await Promise.all([
        api.get('/api/sales/'),
        api.get('/api/inventory/'),
        api.get('/api/sales/stats/top-selling')
      ])
      setSales(salesRes.data)
      setProducts(productsRes.data)
      setTopProducts(topRes.data)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch sales dashboard records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPageData()
  }, [])

  const handleOpenAddModal = () => {
    if (products.length === 0) {
      alert('You need to add products to the catalog before recording sales.')
      return
    }
    setFormData({
      product_id: products[0].id.toString(),
      quantity: 1,
      amount: ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction? This will restore the product stock.')) return
    try {
      await api.delete(`/api/sales/${id}`)
      // Reload everything to sync stock numbers
      loadPageData()
    } catch (err) {
      console.error(err)
      alert('Failed to delete transaction.')
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    
    // Check if sufficient quantity exists in catalog
    const selectedProd = products.find(p => p.id.toString() === formData.product_id)
    if (selectedProd && selectedProd.quantity < formData.quantity) {
      alert(`Insufficient inventory. Only ${selectedProd.quantity} units available.`)
      return
    }

    try {
      const payload = {
        product_id: parseInt(formData.product_id),
        quantity: parseInt(formData.quantity),
        amount: formData.amount === '' ? null : parseFloat(formData.amount)
      }
      await api.post('/api/sales/', payload)
      setIsModalOpen(false)
      // Reload entire list & statistics
      loadPageData()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.detail || 'Failed to record transaction.')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner with Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Logs Table (takes 2 cols) */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Transaction Ledger</h3>
              <p className="text-[10px] text-slate-400">Chronological history of product invoice records</p>
            </div>
            
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <Plus size={14} />
              <span>Record Sale</span>
            </button>
          </div>

          {loading ? (
            <div className="flex py-12 justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
            </div>
          ) : sales.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">No transactions recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2">
                    <th className="py-3 px-4">Invoice ID</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Date</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Wipe</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/10 transition">
                      <td className="py-3.5 px-4 text-slate-500 font-mono">#INV-{s.id}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200">{s.product_name}</td>
                      <td className="py-3.5 px-4 text-center text-slate-300 font-medium">{s.quantity}</td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-400">₹{s.amount.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">{new Date(s.sale_date).toLocaleDateString()}</td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDelete(s.id)}
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

        {/* Top Selling Products Widget Panel */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5 h-fit">
          <div className="flex items-center gap-2 text-brand-400">
            <Award size={18} />
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Top Performing Catalogs</h3>
          </div>
          <p className="text-[10px] text-slate-400">Products generating the highest sales counts in volume:</p>
          
          <div className="space-y-4">
            {loading ? (
              <div className="flex py-6 justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
              </div>
            ) : topProducts.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">No performance records.</div>
            ) : (
              topProducts.map((p, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-200">{p.product_name}</span>
                    <span className="text-brand-300">{p.units_sold} units</span>
                  </div>
                  {/* Progress Bar visual indicator */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-brand-600 to-brand-400 h-full rounded-full"
                      style={{ 
                        width: `${Math.min(100, (p.units_sold / (topProducts[0]?.units_sold || 1)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-[9px] text-slate-400 text-right">Revenue: ₹{p.revenue.toFixed(2)}</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Record Transaction Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card w-full max-w-sm rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={16} className="text-brand-400" />
                Record Sales Transaction
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Select Catalog Product</label>
                <select
                  required
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-brand-500 cursor-pointer"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product_name} (₹{p.price.toFixed(2)} | Stock: {p.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Custom Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                    placeholder="Leave empty for catalog rate"
                  />
                </div>
              </div>

              {/* Action Buttons */}
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
                  Post Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sales
