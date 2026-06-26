import React, { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import DashboardCard from '../components/DashboardCard'
import { 
  Boxes, 
  Users, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl shadow-xl space-y-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <div className="space-y-0.5 text-[11px]">
          {payload.map((p, idx) => (
            <p key={idx} style={{ color: p.color }}>
              <span className="font-semibold text-slate-300">{p.name}:</span> ₹{p.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          ))}
        </div>
      </div>
    )
  }
  return null
}

const Dashboard = () => {
  const { user, isManager } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTrend, setActiveTrend] = useState('both')
  const [error, setError] = useState('')

  const COLORS = ['#386da6', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/api/dashboard/summary')
        setData(res.data)
      } catch (err) {
        console.error(err)
        setError('Failed to fetch dashboard data. Make sure backend is active.')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-400 text-sm">
        {error}
      </div>
    )
  }

  const { stats, monthly_trend, category_distribution } = data

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Welcome Back, {user?.username}!</h2>
          <p className="text-xs text-slate-400 mt-1">Here is a quick look at your business operations metrics for today.</p>
        </div>
        <div className="px-4 py-2 bg-brand-500/10 border border-brand-500/20 rounded-xl text-xs font-semibold text-brand-300 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          AuraERP Systems Live
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard 
          title="Total Products" 
          value={stats.total_products} 
          icon={Boxes} 
          subtext="Items registered in catalog"
          color="blue"
        />
        <DashboardCard 
          title="Total Employees" 
          value={stats.total_employees} 
          icon={Users} 
          subtext="Active payroll directory count"
          color="blue"
        />
        <DashboardCard 
          title="Total Sales" 
          value={`₹${stats.total_sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          icon={TrendingUp} 
          subtext="Cumulative gross invoice volume"
          color="green"
        />
        <DashboardCard 
          title="Operating Expenses" 
          value={isManager ? `₹${stats.total_expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '🔒 Restricted'} 
          icon={DollarSign} 
          subtext={isManager ? "Cumulative ledger expenditures" : "Requires Manager role"}
          color={isManager ? "amber" : "red"}
        />
      </div>

      {/* Analytics Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (Sales & Expenses) */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Financial Operations Trend</h3>
              <p className="text-[10px] text-slate-400">Monthly overview of sales invoices vs operating expenses</p>
            </div>
            {/* Interactive Filters */}
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTrend('both')}
                className={`px-3 py-1 rounded-xl text-[9px] font-bold uppercase transition ${activeTrend === 'both' ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'bg-slate-800/40 text-slate-400 border border-slate-800 hover:text-slate-200'}`}
              >
                All
              </button>
              <button 
                onClick={() => setActiveTrend('sales')}
                className={`px-3 py-1 rounded-xl text-[9px] font-bold uppercase transition ${activeTrend === 'sales' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800/40 text-slate-400 border border-slate-800 hover:text-slate-200'}`}
              >
                Sales
              </button>
              {isManager && (
                <button 
                  onClick={() => setActiveTrend('expenses')}
                  className={`px-3 py-1 rounded-xl text-[9px] font-bold uppercase transition ${activeTrend === 'expenses' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800/40 text-slate-400 border border-slate-800 hover:text-slate-200'}`}
                >
                  Expenses
                </button>
              )}
            </div>
          </div>
          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                {(activeTrend === 'both' || activeTrend === 'sales') && (
                  <Area type="monotone" dataKey="sales" name="Sales (₹)" stroke="#10b981" fillOpacity={1} fill="url(#salesGrad)" strokeWidth={2} />
                )}
                {isManager && (activeTrend === 'both' || activeTrend === 'expenses') && (
                  <Area type="monotone" dataKey="expenses" name="Expenses (₹)" stroke="#f59e0b" fillOpacity={1} fill="url(#expensesGrad)" strokeWidth={2} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category distribution Bar Chart */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Inventory Distribution</h3>
            <p className="text-[10px] text-slate-400">Total physical stock pieces grouped by category</p>
          </div>
          <div className="h-80 w-full text-xs flex items-center justify-center">
            {category_distribution.length === 0 ? (
              <p className="text-slate-500 text-sm">No items in inventory.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={category_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="category" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Bar dataKey="stock" name="Stock Count" radius={[4, 4, 0, 0]}>
                    {category_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Alerts & Warnings Widget Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Low Stock Alerts */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-500">
            <AlertTriangle size={18} />
            <h3 className="text-sm font-semibold text-slate-200">Critical Stock Reminders</h3>
          </div>
          <p className="text-[10px] text-slate-400">The following items are running low (under 10 units) and require restocking:</p>
          <div className="divide-y divide-slate-800 max-h-48 overflow-y-auto pr-1">
            {stats.low_stock_count === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500">All products are healthy. No alerts active.</div>
            ) : (
              category_distribution.filter(c => c.stock < 10).map((c, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">{c.category} Stock Segment</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/25">
                    {c.stock} units left
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick actions panel */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-brand-400">
            <FileSpreadsheet size={18} />
            <h3 className="text-sm font-semibold text-slate-200">ERP Quick Actions</h3>
          </div>
          <p className="text-[10px] text-slate-400">Shortcuts to manage your enterprise operations dashboard:</p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <a href="/inventory" className="p-3 bg-slate-800/40 hover:bg-slate-800 text-center text-xs font-semibold rounded-xl border border-slate-800 transition">
              Manage Catalog
            </a>
            <a href="/employees" className="p-3 bg-slate-800/40 hover:bg-slate-800 text-center text-xs font-semibold rounded-xl border border-slate-800 transition">
              Payroll Directory
            </a>
            <a href="/ai-assistant" className="p-3 bg-brand-500/10 hover:bg-brand-500/20 text-center text-xs font-semibold rounded-xl border border-brand-500/25 text-brand-300 transition col-span-2">
              Launch AI Assistant Chat
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
