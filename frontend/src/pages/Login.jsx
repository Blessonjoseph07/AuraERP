import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, KeyRound, User, AlertCircle } from 'lucide-react'
import FloatingBlob from '../components/FloatingBlob'
import AsciiGrid from '../components/AsciiGrid'

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || 'Incorrect username or password. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-tr from-[#dfdad0] to-[#eae4d9] px-4 relative overflow-hidden">
      
      {/* Interactive Reacting ASCII Grid Canvas */}
      <AsciiGrid />

      {/* Large wobbly blob positioned in the exact center background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 select-none">
        <FloatingBlob className="scale-[1.1] md:scale-[1.3] opacity-95" />
      </div>

      {/* Main fully transparent login card layout overlaying the blob */}
      <div className="w-full max-w-md bg-transparent p-6 md:p-8 rounded-[2rem] relative z-10 animate-fade-in">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <img 
            src="/logo.png" 
            alt="AuraERP Logo" 
            className="h-16 w-16 object-contain mb-3" 
          />
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">
            AuraERP Console
          </h2>
          <p className="text-sm text-slate-600 mt-1 text-center">Sign in to manage your corporate workspace</p>
        </div>

        {/* Form Container */}
        <div>
          {error && (
            <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-xs font-medium text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label htmlFor="username_field" className="text-xs font-semibold text-slate-600 tracking-wide uppercase">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <User size={16} />
                </div>
                <input
                  id="username_field"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/70 backdrop-blur-md border border-white/80 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition duration-200"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password_field" className="text-xs font-semibold text-slate-600 tracking-wide uppercase">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <KeyRound size={16} />
                </div>
                <input
                  id="password_field"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/70 backdrop-blur-md border border-white/80 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button with Rust Orange accents */}
            <button
              id="login_submit_btn"
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-brand-500 to-brand-400 hover:from-brand-400 hover:to-brand-300 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none transition duration-200 cursor-pointer mt-5"
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>


          <div className="mt-5 text-center text-xs text-slate-600 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 hover:text-brand-500 font-bold transition">
              Create an account
            </Link>
          </div>
        </div>
      </div>
      
    </div>
  )
}

export default Login
