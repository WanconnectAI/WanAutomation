import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function WelcomePage() {
  const [showLogin, setShowLogin] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { login } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    const e = {}
    if (!username.trim()) e.username = 'Username is required'
    if (!password.trim()) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await login(username, password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg">OpsPortal</span>
        </div>
        <button onClick={() => setShowLogin(true)} className="bg-white text-blue-700 font-semibold px-5 py-2 rounded-lg hover:bg-blue-50 transition shadow-sm text-sm">
          Login
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="w-24 h-24 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg border border-white/20">
            <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-4 leading-tight">
            Operations Portal
          </h1>
          <p className="text-blue-200 text-xl mb-3 font-medium">Centralize. Automate. Operate.</p>
          <p className="text-blue-300 text-base max-w-xl mx-auto mb-10">
            A unified platform to manage forms, track submissions, and orchestrate automation workflows — all in one place.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-12">
            {['Smart Forms', 'Workflow Automation', 'Real-time Dashboard', 'Data Export'].map(f => (
              <span key={f} className="bg-white/10 border border-white/20 text-white text-sm px-4 py-2 rounded-full backdrop-blur">{f}</span>
            ))}
          </div>

          <button onClick={() => setShowLogin(true)} className="bg-white text-blue-700 font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition shadow-lg text-base">
            Access Portal →
          </button>
        </div>
      </main>

      {/* Stats bar */}
      <div className="bg-white/10 backdrop-blur border-t border-white/20 py-6 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[['4', 'Form Types'], ['∞', 'Submissions'], ['n8n', 'Powered Workflows'], ['JWT', 'Secure Auth']].map(([val, label]) => (
            <div key={label}>
              <div className="text-2xl font-bold text-white">{val}</div>
              <div className="text-blue-300 text-sm">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowLogin(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Sign In</h2>
                <p className="text-sm text-gray-500 mt-0.5">Access the Operations Portal</p>
              </div>
              <button onClick={() => setShowLogin(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label">Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} className={`input-field ${errors.username ? 'input-error' : ''}`} placeholder="Enter username" autoFocus />
                {errors.username && <p className="error-msg">{errors.username}</p>}
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={`input-field ${errors.password ? 'input-error' : ''}`} placeholder="Enter password" />
                {errors.password && <p className="error-msg">{errors.password}</p>}
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 mt-2">
                {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Signing in...</span></> : 'Sign In'}
              </button>
            </form>

            <div className="mt-5 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700 font-medium mb-1">Demo credentials:</p>
              <p className="text-xs text-blue-600">admin / admin123</p>
              <p className="text-xs text-blue-600">opsmanager / ops456</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
