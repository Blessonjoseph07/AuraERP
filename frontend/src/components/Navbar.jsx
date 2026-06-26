import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, User } from 'lucide-react'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Get active route display name
  const getPageTitle = () => {
    const path = location.pathname
    if (path.includes('/dashboard')) return 'Dashboard Overview'
    if (path.includes('/inventory')) return 'Inventory Management'
    if (path.includes('/employees')) return 'Employee Directory'
    if (path.includes('/sales')) return 'Sales Operations'
    if (path.includes('/finance')) return 'Finance Ledger'
    if (path.includes('/ai-assistant')) return 'AI Smart Workspace'
    return 'AuraERP Console'
  }

  const getRoleBadgeClass = () => {
    switch (user?.role) {
      case 'Admin':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
      case 'Manager':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
      default:
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    }
  }

  return (
    <header className="h-16 glass-card border-b border-slate-800/80 px-6 flex items-center justify-between z-10 sticky top-0">
      {/* Title / Breadcrumb */}
      <div>
        <h1 className="text-lg font-bold text-slate-100">{getPageTitle()}</h1>
        <p className="text-[10px] text-slate-400">Enterprise Resource Planning Portal</p>
      </div>

      {/* Profile & Logout Action */}
      <div className="flex items-center gap-4">
        {/* User Card */}
        <div className="flex items-center gap-3 bg-slate-800/40 py-1.5 pl-3 pr-3 rounded-xl border border-slate-800">
          <div className="flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-200">{user?.username}</span>
            <span className={`mt-0.5 self-end px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase ${getRoleBadgeClass()}`}>
              {user?.role}
            </span>
          </div>
          <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-400">
            <User size={16} />
          </div>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-800"></div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800/80 hover:bg-red-500/10 hover:text-red-400 text-slate-400 text-xs font-semibold rounded-xl border border-slate-700/80 transition duration-200 cursor-pointer"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}

export default Navbar
