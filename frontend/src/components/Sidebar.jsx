import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  LayoutDashboard, 
  Boxes, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Bot,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react'

const Sidebar = () => {
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Employee'] },
    { name: 'Inventory', path: '/inventory', icon: Boxes, roles: ['Admin', 'Manager', 'Employee'] },
    { name: 'Employees', path: '/employees', icon: Users, roles: ['Admin', 'Manager', 'Employee'] },
    { name: 'Sales', path: '/sales', icon: TrendingUp, roles: ['Admin', 'Manager', 'Employee'] },
    { name: 'Finance', path: '/finance', icon: DollarSign, roles: ['Admin', 'Manager'] }, // Manager/Admin only
    { name: 'AI Workspace', path: '/ai-assistant', icon: Bot, roles: ['Admin', 'Manager', 'Employee'] },
  ]

  const filteredItems = navItems.filter(item => item.roles.includes(user?.role))

  return (
    <aside 
      className={`glass-card min-h-screen text-slate-100 flex flex-col transition-all duration-300 border-r border-slate-800 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
        {!collapsed && (
          <div className="flex items-center gap-2.5 animate-fade-in">
            <img src="/logo.png" alt="AuraERP Logo" className="h-8 w-8 object-contain rounded-lg border border-slate-800 shadow-md" />
            <div>
              <span className="font-extrabold text-lg bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Aura</span>
              <span className="font-extrabold text-lg text-brand-400">ERP</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex items-center justify-center">
            <img src="/logo.png" alt="AuraERP Logo" className="h-8 w-8 object-contain rounded-lg border border-slate-800 shadow-md" />
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/80 transition"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-6 space-y-1.5">
        {filteredItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-gradient-to-r from-brand-600/30 to-brand-500/10 text-brand-300 font-semibold border-l-4 border-brand-500 shadow-md shadow-brand-500/5'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                }`
              }
            >
              <Icon size={20} className="shrink-0 transition-transform duration-200 group-hover:scale-105" />
              {!collapsed && <span className="text-sm font-medium animate-fade-in">{item.name}</span>}
              
              {/* Tooltip for collapsed mode */}
              {collapsed && (
                <div className="absolute left-20 hidden group-hover:block bg-slate-950 text-slate-100 text-xs font-semibold px-2.5 py-1.5 rounded shadow-lg border border-slate-800 whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer / User Info Snapshot */}
      <div className="p-4 border-t border-slate-800/80 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-brand-400 border border-slate-700">
          {user?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0 animate-fade-in">
            <p className="text-xs font-bold text-slate-200 truncate">{user?.username}</p>
            <p className="text-[10px] text-slate-400 truncate capitalize">{user?.role}</p>
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
