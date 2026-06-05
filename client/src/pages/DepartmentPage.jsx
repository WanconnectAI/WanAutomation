import React from 'react'

const DEPT_META = {
  accounting: {
    icon: '📊',
    color: 'blue',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    accent: 'text-blue-600',
    description: 'AI-assisted bookkeeping, ledger analysis, financial statement review, and anomaly detection for accounting workflows.',
    features: ['Smart ledger reconciliation', 'Invoice classification', 'Financial report analysis', 'Anomaly & fraud detection'],
  },
  audit: {
    icon: '🔍',
    color: 'purple',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    accent: 'text-purple-600',
    description: 'AI-powered audit trail analysis, risk scoring, compliance checking, and automated working paper generation.',
    features: ['Risk-based audit scoping', 'Automated workpaper drafts', 'Compliance gap analysis', 'Evidence classification'],
  },
  consulting: {
    icon: '💼',
    color: 'green',
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-700',
    accent: 'text-green-600',
    description: 'AI tools for business strategy recommendations, client proposal drafting, and engagement management.',
    features: ['Strategy recommendation engine', 'Proposal & report drafting', 'Client insight summaries', 'Benchmark analysis'],
  },
  taxation: {
    icon: '🧾',
    color: 'orange',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    accent: 'text-orange-600',
    description: 'AI-assisted tax computation, ruling lookups, deadline tracking, and compliance report generation.',
    features: ['Tax computation assistant', 'LHDN ruling search', 'Filing deadline alerts', 'GST/SST reconciliation'],
  },
  'co-sec': {
    icon: '📋',
    color: 'red',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
    accent: 'text-red-600',
    description: 'AI support for company secretarial duties including resolution drafting, statutory filing reminders, and register management.',
    features: ['Resolution & minutes drafting', 'SSM filing reminders', 'Director/shareholder registers', 'Annual return preparation'],
  },
  internal: {
    icon: '🏢',
    color: 'gray',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-700',
    accent: 'text-gray-600',
    description: 'Internal AI tools for HR, operations, document management, and cross-department collaboration.',
    features: ['HR document generation', 'Operations reporting', 'Policy & SOP assistant', 'Internal knowledge base'],
  },
}

export default function DepartmentPage({ deptId, label }) {
  const meta = DEPT_META[deptId] || DEPT_META.internal

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className={`rounded-2xl border-2 ${meta.border} ${meta.bg} p-6`}>
        <div className="flex items-center gap-4">
          <div className="text-5xl">{meta.icon}</div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.badge}`}>Department AI</span>
              <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">Coming Soon</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{label}</h1>
            <p className="text-gray-600 text-sm mt-1 max-w-xl">{meta.description}</p>
          </div>
        </div>
      </div>

      {/* Planned features */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 12l2 2 4-4" />
          </svg>
          Planned AI Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {meta.features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${meta.bg} ${meta.border} border flex-shrink-0`}>
                <svg className={`w-4 h-4 ${meta.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-sm text-gray-700 font-medium">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Roadmap timeline */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Development Roadmap</h2>
        <div className="space-y-3">
          {[
            { phase: 'Phase 1', label: 'Core portal & forms', status: 'done' },
            { phase: 'Phase 2', label: 'Client portal & login', status: 'active' },
            { phase: 'Phase 3', label: 'Student & course management', status: 'upcoming' },
            { phase: 'Phase 4', label: `${label} AI tools`, status: 'upcoming' },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
                ${step.status === 'done' ? 'bg-green-500 text-white' : step.status === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {step.status === 'done' ? '✓' : i + 1}
              </div>
              <div className="flex-1">
                <span className="text-xs font-semibold text-gray-400 uppercase">{step.phase}</span>
                <span className="mx-2 text-gray-300">·</span>
                <span className={`text-sm ${step.status === 'done' ? 'text-gray-500 line-through' : step.status === 'active' ? 'text-blue-700 font-semibold' : 'text-gray-600'}`}>
                  {step.label}
                </span>
              </div>
              {step.status === 'active' && (
                <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">In Progress</span>
              )}
              {step.status === 'upcoming' && (
                <span className="text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">Upcoming</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
