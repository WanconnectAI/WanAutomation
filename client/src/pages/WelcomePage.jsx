import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function WelcomePage() {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <img
              src="/logo-wanconnect.png"
              alt="Wanconnect"
              className="h-20 object-contain drop-shadow-lg"
              onError={e => { e.target.onerror = null; e.target.src = '/logo-wc-icon.jpg' }}
            />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Wanconnect Portal</h1>
          <p className="text-blue-200 text-sm mt-1">Operations Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Sign In</h2>
          <p className="text-sm text-gray-500 mb-6">Enter your credentials to access the portal</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className={`input-field ${errors.username ? 'input-error' : ''}`}
                placeholder="Enter username"
                autoFocus
              />
              {errors.username && <p className="error-msg">{errors.username}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`input-field ${errors.password ? 'input-error' : ''}`}
                placeholder="Enter password"
              />
              {errors.password && <p className="error-msg">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2 text-base"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Signing in...</span></>
                : 'Sign In →'
              }
            </button>
          </form>
        </div>

        <p className="text-center text-blue-300 text-xs mt-6">
          © {new Date().getFullYear()} Wanconnect Advisory PLT. All rights reserved.
        </p>
      </div>
    </div>
  )
}
