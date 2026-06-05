import React from 'react'
import { useNavigate } from 'react-router-dom'

const ROADMAP_ITEMS = [
  { label: 'Core infrastructure & database schema', done: true },
  { label: 'Authentication & role management', done: true },
  { label: 'Forms & submissions engine', done: true },
  { label: 'Workflow & automation flows', done: true },
  { label: 'UI design & navigation', done: false },
  { label: 'Data ingestion & module APIs', done: false },
  { label: 'Beta testing & QA', done: false },
  { label: 'Production launch', done: false },
]

export default function ComingSoonPage({ title = 'Coming Soon' }) {
  const navigate = useNavigate()

  const completedCount = ROADMAP_ITEMS.filter(i => i.done).length
  const progressPct = Math.round((completedCount / ROADMAP_ITEMS.length) * 100)

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      {/* Hero card */}
      <div className="card p-10 text-center space-y-4">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-4xl shadow-sm">
          🚧
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500 text-sm mt-2 leading-relaxed">
            This feature is currently being built. Check back soon — we are working hard to bring it to you!
          </p>
        </div>

        {/* Progress bar */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-500">Overall build progress</span>
            <span className="text-xs font-bold text-blue-600">{progressPct}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Back button */}
        <div className="pt-2">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary text-sm inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go Back
          </button>
        </div>
      </div>

      {/* Roadmap teaser */}
      <div className="card p-6 mt-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Build Roadmap</h2>
        <ul className="space-y-3">
          {ROADMAP_ITEMS.map((item, idx) => (
            <li key={idx} className="flex items-center gap-3">
              {item.done ? (
                <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              ) : (
                <span className="w-5 h-5 rounded-full bg-gray-100 border-2 border-gray-200 flex-shrink-0" />
              )}
              <span className={`text-sm ${item.done ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                {item.label}
              </span>
              {item.done && (
                <span className="ml-auto badge bg-green-50 text-green-700 text-xs">Done</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
