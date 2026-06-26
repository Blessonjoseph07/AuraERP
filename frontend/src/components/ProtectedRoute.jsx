import React from 'react'
import { Navigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 m-auto h-4 w-4 rounded-full bg-brand-500 animate-ping"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    // Redirect to login if user session is absent
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Render high quality forbidden state
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center text-center p-8 bg-slate-900 rounded-xl border border-red-500/20">
        <div className="mb-4 rounded-full bg-red-500/10 p-4 text-red-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Access Restricted</h2>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          Your account role (<strong className="text-brand-400">{user.role}</strong>) does not have authorization to view this resource. Please contact your administrator.
        </p>
        <Link to="/dashboard" className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-lg transition border border-slate-700">
          Return to Dashboard
        </Link>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
