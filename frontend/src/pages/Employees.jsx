import React, { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Plus, Edit2, Trash2, Search, CalendarClock, UserCheck, X } from 'lucide-react'

const Employees = () => {
  const { isManager, isAdmin } = useAuth()

  const [employees, setEmployees] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add/Edit Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    designation: '',
    email: '',
    leave_balance: 20
  })

  // Leave Modal states
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [activeEmployeeId, setActiveEmployeeId] = useState(null)
  const [leaveDays, setLeaveDays] = useState(1)

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/api/employees/', {
        params: { search: search || undefined }
      })
      setEmployees(res.data)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch employee list. Ensure API is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [search])

  const handleOpenAddModal = () => {
    setEditingEmployee(null)
    setFormData({
      name: '',
      department: '',
      designation: '',
      email: '',
      leave_balance: 20
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (employee) => {
    setEditingEmployee(employee)
    setFormData({
      name: employee.name,
      department: employee.department,
      designation: employee.designation,
      email: employee.email,
      leave_balance: employee.leave_balance
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee record?')) return
    try {
      await api.delete(`/api/employees/${id}`)
      setEmployees(employees.filter(e => e.id !== id))
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.detail || 'Failed to delete employee profile.')
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingEmployee) {
        // Edit employee profile
        const res = await api.put(`/api/employees/${editingEmployee.id}`, formData)
        setEmployees(employees.map(e => e.id === editingEmployee.id ? res.data : e))
      } else {
        // Create employee profile
        const res = await api.post('/api/employees/', formData)
        setEmployees([res.data, ...employees])
      }
      setIsModalOpen(false)
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.detail || 'Failed to submit profile.')
    }
  }

  // Open Leave management
  const handleOpenLeaveModal = (id) => {
    setActiveEmployeeId(id)
    setLeaveDays(1)
    setIsLeaveModalOpen(true)
  }

  // Book leave
  const handleBookLeave = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post(`/api/employees/${activeEmployeeId}/leave`, {
        days: leaveDays
      })
      // Update local list state
      setEmployees(employees.map(e => e.id === activeEmployeeId ? res.data : e))
      setIsLeaveModalOpen(false)
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.detail || 'Failed to request leave.')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search by name, role or dept..."
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
            <span>Add Employee</span>
          </button>
        )}
      </div>

      {/* Directory Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="flex py-12 justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-red-400">{error}</div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No employees listed in the corporate directory.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 tracking-wider uppercase bg-slate-900/40">
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">Employee</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Designation</th>
                  <th className="py-4 px-6">Leave Balance</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {employees.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/20 transition">
                    <td className="py-4 px-6 text-slate-500 font-mono">#{e.id}</td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-200">{e.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{e.email}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-400 font-medium">{e.department}</td>
                    <td className="py-4 px-6 text-slate-400">{e.designation}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        e.leave_balance < 5 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {e.leave_balance} days left
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenLeaveModal(e.id)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-brand-400 hover:text-brand-300 rounded-lg transition"
                        title="Book Leave Day"
                      >
                        <CalendarClock size={12} />
                      </button>
                      {isManager && (
                        <button
                          onClick={() => handleOpenEditModal(e)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                          title="Edit Profile"
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 text-slate-300 rounded-lg transition"
                          title="Delete Employee"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Profile Form Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card w-full max-w-md rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <UserCheck size={16} className="text-brand-400" />
                {editingEmployee ? 'Modify Employee Profile' : 'Enroll New Employee'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                  placeholder="e.g. Jane Doe"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                  placeholder="e.g. jane@company.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Department</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                    placeholder="e.g. Marketing"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Designation</label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                    placeholder="e.g. Content Writer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Initial Leave Balance (Days)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.leave_balance}
                  onChange={(e) => setFormData({ ...formData, leave_balance: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                />
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
                  {editingEmployee ? 'Save Profile' : 'Enroll Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Application Modal Overlay */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-card w-full max-w-sm rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <CalendarClock size={16} className="text-brand-400" />
                Book Leave Period
              </h3>
              <button onClick={() => setIsLeaveModalOpen(false)} className="text-slate-400 hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleBookLeave} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Number of leave days requesting</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={leaveDays}
                  onChange={(e) => setLeaveDays(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-semibold rounded-xl shadow-lg transition"
                >
                  Deduct Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Employees
