import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const formLabels = { job_application: 'Job Application', seminar_registration: 'Seminar Registration', staff_claim: 'Staff Claim', client_request: 'Client Request' }

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-green-600 font-medium mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    axios.get('/api/dashboard/stats').then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const quickForms = [
    { type: 'job_application', label: 'Job Application', color: 'bg-purple-100 text-purple-700', icon: '📋' },
    { type: 'seminar_registration', label: 'Seminar Registration', color: 'bg-green-100 text-green-700', icon: '🎓' },
    { type: 'staff_claim', label: 'Staff Claim', color: 'bg-orange-100 text-orange-700', icon: '💰' },
    { type: 'client_request', label: 'Client Request', color: 'bg-blue-100 text-blue-700', icon: '📝' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const chartData = (stats?.submissionsByForm || []).map(r => ({
    name: formLabels[r.form_type] || r.form_type,
    submissions: r.count
  }))

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your operations portal</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Form Types" value={stats?.totalForms ?? 4} color="bg-blue-100" icon={<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
        <StatCard label="Total Submissions" value={stats?.totalSubmissions ?? 0} sub={`${stats?.todaySubmissions ?? 0} today`} color="bg-green-100" icon={<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="Active Workflows" value={stats?.activeWorkflows ?? 0} color="bg-yellow-100" icon={<svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
        <StatCard label="Total Workflows" value={stats?.totalWorkflows ?? 0} color="bg-purple-100" icon={<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="card p-5 xl:col-span-2">
          <h2 className="font-semibold text-gray-800 mb-4">Submissions by Form</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="submissions" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No submissions yet</div>
          )}
        </div>

        {/* Quick Links */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Quick Access Forms</h2>
          <div className="space-y-2">
            {quickForms.map(f => (
              <button key={f.type} onClick={() => navigate(`/forms/${f.type}`)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition hover:shadow-sm ${f.color.replace('text-', 'border-').replace('700', '200')} ${f.color}`}>
                <span className="text-lg">{f.icon}</span>
                <span className="text-sm font-medium">{f.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent submissions */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Recent Submissions</h2>
        {stats?.recentSubmissions?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b border-gray-100">
                <th className="pb-3 font-medium text-gray-500">ID</th>
                <th className="pb-3 font-medium text-gray-500">Form Type</th>
                <th className="pb-3 font-medium text-gray-500">Submitted By</th>
                <th className="pb-3 font-medium text-gray-500">Date</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentSubmissions.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="py-3 text-gray-400">#{s.id}</td>
                    <td className="py-3"><span className="badge bg-blue-50 text-blue-700">{formLabels[s.form_type] || s.form_type}</span></td>
                    <td className="py-3 text-gray-600">{s.submitted_by}</td>
                    <td className="py-3 text-gray-400">{new Date(s.submitted_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-8">No submissions yet. Try submitting a form!</p>
        )}
      </div>
    </div>
  )
}
