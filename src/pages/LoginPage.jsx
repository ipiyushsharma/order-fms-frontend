import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Package } from 'lucide-react'

const DEMO_ACCOUNTS = [
  { username: 'Admin@cervo',    password: 'Admin@123',    role: 'Admin',         color: 'bg-purple-100 text-purple-700' },
  { username: 'CRR@cervo',      password: 'CRR@123',      role: 'CRR Team',      color: 'bg-teal-100 text-teal-700' },
  { username: 'Accounts@cervo', password: 'Accounts@123', role: 'Accounts Team', color: 'bg-amber-100 text-amber-700' },
  { username: 'Dispatch@cervo', password: 'Dispatch@123', role: 'Dispatch Team', color: 'bg-blue-100 text-blue-700' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.username || !form.password) return
    setSubmitting(true)
    try {
      await login(form.username, form.password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials')
    } finally {
      setSubmitting(false)
    }
  }

  function fillDemo(acc) {
    setForm({ username: acc.username, password: acc.password })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Package size={20} className="text-white" />
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900 leading-none">Order FMS</div>
            <div className="text-xs text-gray-500">Field Management System</div>
          </div>
        </div>

        {/* Card */}
        <div className="card p-8 shadow-xl shadow-gray-200/60">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Sign in</h1>
          <p className="text-sm text-gray-500 mb-6">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input
                className="input"
                placeholder="Enter username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                autoComplete="username"
                autoFocus
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting || !form.username || !form.password}
              className="btn btn-primary w-full justify-center py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        {/* Demo accounts */}

      </div>
    </div>
  )
}
