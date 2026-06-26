import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Employees from './pages/Employees'
import Sales from './pages/Sales'
import Finance from './pages/Finance'
import AIAssistant from './pages/AIAssistant'

// Inner layout template incorporating sidebar and top navbar
const DashboardLayout = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Core contents panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <Navbar />
        
        {/* Page content window */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950/20">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RouteRedirectIfLoggedIn><Register /></RouteRedirectIfLoggedIn>} />

          {/* Protected Console Routes */}
          <Route 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/sales" element={<Sales />} />
            
            {/* Restricted Finance Ledger */}
            <Route 
              path="/finance" 
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                  <Finance />
                </ProtectedRoute>
              } 
            />
            
            <Route path="/ai-assistant" element={<AIAssistant />} />
          </Route>

          {/* Redirect fallbacks */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

// Redirect utility checking if user is already authenticated
const RouteRedirectIfLoggedIn = ({ children }) => {
  const token = localStorage.getItem('smarterp_token')
  if (token) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

export default App
