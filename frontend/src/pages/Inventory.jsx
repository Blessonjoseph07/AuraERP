import React, { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Plus, Edit2, Trash2, Search, AlertCircle, Sparkles, X } from 'lucide-react'

const Inventory = () => {
  const { isManager, isAdmin } = useAuth()
  
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add/Edit Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    product_name: '',
    category: '',
    quantity: 0,
    price: 0.0,
    supplier: ''
  })
  
  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/inventory/', {
        params: { search: search || undefined }
      })
      setProducts(res.data)
    } catch (err) {
      console.error(err)
      setError('Failed to load inventory. Ensure API is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [search])

  const handleOpenAddModal = () => {
    setEditingProduct(null)
    setFormData({
      product_name: '',
      category: '',
      quantity: 0,
      price: 0.0,
      supplier: ''
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (product) => {
    setEditingProduct(product)
    setFormData({
      product_name: product.product_name,
      category: product.category,
      quantity: product.quantity,
      price: product.price,
      supplier: product.supplier || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? This will also remove any related sales records.')) return
    try {
      await api.delete(`/api/inventory/${id}`)
      setProducts(products.filter(p => p.id !== id))
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.detail || 'Failed to delete product.')
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingProduct) {
        // Edit product
        const res = await api.put(`/api/inventory/${editingProduct.id}`, formData)
        setProducts(products.map(p => p.id === editingProduct.id ? res.data : p))
      } else {
        // Create product
        const res = await api.post('/api/inventory/', formData)
        setProducts([res.data, ...products])
      }
      setIsModalOpen(false)
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.detail || 'Failed to submit form.')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition duration-200"
          />
        </div>

        {/* Action Button */}
        {isManager && (
          <button
            onClick={handleOpenAddModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/10 transition cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        )}
      </div>

      {/* Main Catalog list */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="flex py-12 justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-red-400">{error}</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No products found in the catalog.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 tracking-wider uppercase bg-slate-900/40">
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">Product Details</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Inventory level</th>
                  <th className="py-4 px-6">Unit Price</th>
                  <th className="py-4 px-6">Supplier</th>
                  {isManager && <th className="py-4 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {products.map((p) => {
                  const isLowStock = p.quantity < 10
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/20 transition">
                      <td className="py-4 px-6 text-slate-500 font-mono">#{p.id}</td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-200">{p.product_name}</div>
                        {isLowStock && (
                          <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wide">
                            <AlertCircle size={10} /> Low Stock Alert
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-400">{p.category}</td>
                      <td className="py-4 px-6 font-semibold">
                        <span className={isLowStock ? 'text-amber-500 font-bold' : 'text-slate-200'}>
                          {p.quantity} units
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-200 font-semibold">₹{p.price.toFixed(2)}</td>
                      <td className="py-4 px-6 text-slate-400">{p.supplier || 'N/A'}</td>
                      {isManager && (
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                            title="Edit Product"
                          >
                            <Edit2 size={12} />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 text-slate-300 rounded-lg transition"
                              title="Delete Product"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit/Add Modal overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card w-full max-w-md rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={16} className="text-brand-400" />
                {editingProduct ? 'Update Product Information' : 'Add New Product Record'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Product Name</label>
                <input
                  type="text"
                  required
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                  placeholder="e.g. Ergonomic Office Chair"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Category</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                    placeholder="e.g. Furniture"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Supplier</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                    placeholder="e.g. OfficeComfort Ltd."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0.0 })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
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
                  {editingProduct ? 'Save Changes' : 'Register Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventory
