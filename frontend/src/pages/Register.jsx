import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, KeyRound, User, Mail, AlertCircle, CheckCircle } from 'lucide-react'
import FloatingBlob from '../components/FloatingBlob'
import AsciiGrid from '../components/AsciiGrid'

const Register = () => {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('Employee')
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      await register(username, email, password, role)
      setSuccess('Account created successfully! Redirecting to login...')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || 'Failed to create account. Username or email might be taken.')
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

      {/* Main highly transparent register card overlaying the blob */}
      <div className="w-full max-w-md bg-transparent p-6 md:p-8 rounded-[2rem] relative z-10 animate-fade-in">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-5">
          <img 
            src="/logo.png" 
            alt="AuraERP Logo" 
            className="h-16 w-16 object-contain mb-3" 
          />
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">
            Create Account
          </h2>
          <p className="text-sm text-slate-600 mt-1 text-center">Join AuraERP platform to manage your company</p>
        </div>

        {/* Form Container */}
        <div>
          {error && (
            <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-xs font-medium text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2.5 text-xs font-medium text-emerald-700">
              <CheckCircle size={16} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Username */}
            <div className="space-y-1.5">
              <label htmlFor="reg_username" className="text-xs font-semibold text-slate-600 tracking-wide uppercase">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <User size={16} />
                </div>
                <input
                  id="reg_username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/70 backdrop-blur-md border border-white/80 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition duration-200"
                  placeholder="Choose username"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="reg_email" className="text-xs font-semibold text-slate-600 tracking-wide uppercase">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-450 pointer-events-none">
                  <Mail size={16} />
                </div>
                <input
                  id="reg_email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/70 backdrop-blur-md border border-white/80 rounded-xl text-slate-800 text-sm placeholder-slate-500 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition duration-200"
                  placeholder="yourname@company.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="reg_password" className="text-xs font-semibold text-slate-600 tracking-wide uppercase">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-450 pointer-events-none">
                  <KeyRound size={16} />
                </div>
                <input
                  id="reg_password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/70 backdrop-blur-md border border-white/80 rounded-xl text-slate-800 text-sm placeholder-slate-500 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-1.5">
              <label htmlFor="reg_role" className="text-xs font-semibold text-slate-600 tracking-wide uppercase">
                Select Workspace Role
              </label>
              <select
                id="reg_role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/70 backdrop-blur-md border border-white/80 rounded-xl text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition duration-200 cursor-pointer"
              >
                <option value="Employee">Employee (Directory, Search & Chat permissions)</option>
                <option value="Manager">Manager (Add/Edit details & Finance permissions)</option>
                <option value="Admin">Admin (Full administrative & delete permissions)</option>
              </select>
            </div>

            {/* Submit Button with Lighter Rust Orange Gradients */}
            <button
              id="register_submit_btn"
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-brand-500 to-brand-400 hover:from-brand-400 hover:to-brand-300 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none transition duration-200 cursor-pointer mt-5"
            >
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-600 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-700 hover:text-brand-600 font-bold transition">
              Sign in
            </Link>
          </div>
        </div>
      </div>
      
    </div>
  )
}

export default Register
