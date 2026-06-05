import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const FORM_LABELS = {
  job_application: 'Job Application',
  seminar_registration: 'Seminar Registration',
  staff_claim: 'Staff Claim',
  client_request: 'Client Request',
}

const FORM_META = [
  { type: 'job_application', label: 'Job Application', color: 'bg-purple-100 text-purple-700', barColor: '#7C3AED', icon: '📋' },
  { type: 'seminar_registration', label: 'Seminar Registration', color: 'bg-green-100 text-green-700', barColor: '#059669', icon: '🎓' },
  { type: 'staff_claim', label: 'Staff Claim', color: 'bg-orange-100 text-orange-700', barColor: '#D97706', icon: '💰' },
  { type: 'client_request', label: 'Client Request', color: 'bg-blue-100 text-blue-700', barColor: '#2563EB', icon: '📝' },
]

const BAR_COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2']

function StatCard({ label, value, icon, colorClass, sub }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-green-600 font-medium mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
        <p className="font-medium text-gray-800 mb-1">{label}</p>
        <p className="text-blue-600">{payload[0].value} submission{payload[0].value !== 1 ? 's' : ''}</p>
      </div>
    )
  }
  return null
}

export default function FormsDashboard() {
  const [stats, setStats] = useState(null)
  const [customForms, setCustomForms] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      axios.get('/api/dashboard/stats'),
      axios.get('/api/custom-forms').catch(() => ({ data: [] })),
    ])
      .then(([statsRes, cfRes]) => {
        setStats(statsRes.data)
        setCustomForms(cfRes.data || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Build chart data from submissionsByForm
  const submissionsByForm = stats?.submissionsByForm || []
  const chartData = submissionsByForm.map(r => ({
    name: FORM_LABELS[r.form_type] || r.form_type,
    submissions: Number(r.count),
  }))

  // Derive per-form counts for the quick links
  const formCountMap = {}
  submissionsByForm.forEach(r => { formCountMap[r.form_type] = Number(r.count) })

  // Find most active form
  let mostActive = null
  let mostActiveCount = 0
  submissionsByForm.forEach(r => {
    const c = Number(r.count)
    if (c > mostActiveCount) {
      mostActiveCount = c
      mostActive = FORM_LABELS[r.form_type] || r.form_type
    }
  })

  const totalForms = (FORM_META.length + customForms.length)
  const totalSubmissions = stats?.totalSubmissions ?? 0
  const todaySubmissions = stats?.todaySubmissions ?? 0

  const allQuickForms = [
    ...FORM_META,
    ...customForms.map((cf, idx) => ({
      type: `custom_${cf.id}`,
      label: cf.name,
      color: 'bg-teal-100 text-teal-700',
      barColor: BAR_COLORS[idx % BAR_COLORS.length],
      icon: '🗂️',
      isCustom: true,
      id: cf.id,
    })),
  ]

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forms Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of all form activity and submissions</p>
        </div>
        <button
          onClick={() => navigate('/forms/submissions')}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 4h6m-6 4h6" />
          </svg>
          View All Submissions
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Forms"
          value={totalForms}
          colorClass="bg-blue-100"
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          label="Total Submissions"
          value={totalSubmissions}
          sub={`${todaySubmissions} today`}
          colorClass="bg-green-100"
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Submissions Today"
          value={todaySubmissions}
          colorClass="bg-yellow-100"
          icon={
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Most Active Form"
          value={mostActive ?? '—'}
          colorClass="bg-purple-100"
          sub={mostActive ? `${mostActiveCount} submission${mostActiveCount !== 1 ? 's' : ''}` : undefined}
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Bar chart */}
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Submissions by Form</h2>
            <button
              onClick={() => navigate('/forms/submissions')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              View all
            </button>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="submissions" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-gray-400">
              <svg className="w-10 h-10 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm">No submission data yet</p>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Quick Access Forms</h2>
          <div className="space-y-2 overflow-y-auto max-h-72">
            {allQuickForms.map(f => {
              const count = f.isCustom
                ? (formCountMap[`custom_${f.id}`] ?? 0)
                : (formCountMap[f.type] ?? 0)
              const path = f.isCustom ? `/forms/custom_${f.id}` : `/forms/${f.type}`
              const borderColorClass = f.color
                .replace('bg-', 'border-')
                .replace('text-', '')
                .replace(/(-\d+)$/, m => m.replace(/\d+/, '200'))
              return (
                <button
                  key={f.type}
                  onClick={() => navigate(path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition hover:shadow-sm text-left ${f.color} border-current/20`}
                >
                  <span className="text-lg">{f.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.label}</p>
                    <p className="text-xs opacity-70">{count} submission{count !== 1 ? 's' : ''}</p>
                  </div>
                  <svg className="w-4 h-4 opacity-50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={() => navigate('/forms')}
              className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h7" />
              </svg>
              Manage All Forms
            </button>
          </div>
        </div>
      </div>

      {/* Recent submissions */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Recent Submissions</h2>
          <button
            onClick={() => navigate('/forms/submissions')}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            View all submissions
          </button>
        </div>
        {stats?.recentSubmissions?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-3 font-medium text-gray-500 text-xs uppercase tracking-wide">ID</th>
                  <th className="pb-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Form Type</th>
                  <th className="pb-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Submitted By</th>
                  <th className="pb-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentSubmissions.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 text-gray-400 text-xs">#{s.id}</td>
                    <td className="py-3">
                      <span className="badge bg-blue-50 text-blue-700 text-xs">
                        {FORM_LABELS[s.form_type] || s.form_type}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600 text-xs">{s.submitted_by}</td>
                    <td className="py-3 text-gray-400 text-xs">{new Date(s.submitted_at).toLocaleString('en-MY')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-8">No submissions yet. Share a form link to get started!</p>
        )}
      </div>
    </div>
  )
}
