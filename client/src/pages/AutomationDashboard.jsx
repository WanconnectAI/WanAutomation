import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const DEPT_COLORS = {
  Finance: 'bg-green-100 text-green-700',
  HR: 'bg-purple-100 text-purple-700',
  Operations: 'bg-blue-100 text-blue-700',
  IT: 'bg-cyan-100 text-cyan-700',
  Marketing: 'bg-pink-100 text-pink-700',
  Sales: 'bg-orange-100 text-orange-700',
  Default: 'bg-gray-100 text-gray-600',
}
const deptColor = d => DEPT_COLORS[d] || DEPT_COLORS.Default

function StatCard({ label, value, colorClass, icon, sub }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function AutomationDashboard() {
  const [workflows, setWorkflows] = useState([])
  const [automations, setAutomations] = useState([])
  const [loadingWF, setLoadingWF] = useState(true)
  const [loadingAuto, setLoadingAuto] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    axios.get('/api/workflows')
      .then(r => setWorkflows(r.data || []))
      .catch(console.error)
      .finally(() => setLoadingWF(false))

    axios.get('/api/automations')
      .then(r => setAutomations(r.data || []))
      .catch(console.error)
      .finally(() => setLoadingAuto(false))
  }, [])

  const totalWorkflows = workflows.length
  const activeWorkflows = workflows.filter(w => w.status === 'Active').length
  const inactiveWorkflows = workflows.filter(w => w.status !== 'Active').length
  const totalFlows = automations.length
  const activeFlows = automations.filter(a => a.is_active).length

  const recentWorkflows = workflows.slice(0, 6)

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automation Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of all automation workflows and flows</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/automation/workflows')}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Workflows
          </button>
          <button
            onClick={() => navigate('/automation/flows')}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Automation Flows
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Workflows"
          value={loadingWF ? '…' : totalWorkflows}
          colorClass="bg-blue-100"
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          }
        />
        <StatCard
          label="Active Workflows"
          value={loadingWF ? '…' : activeWorkflows}
          colorClass="bg-green-100"
          sub={`${inactiveWorkflows} inactive`}
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Inactive Workflows"
          value={loadingWF ? '…' : inactiveWorkflows}
          colorClass="bg-gray-100"
          icon={
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          }
        />
        <StatCard
          label="Automation Flows"
          value={loadingAuto ? '…' : totalFlows}
          colorClass="bg-purple-100"
          sub={`${activeFlows} active`}
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent workflows list */}
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Recent Workflows</h2>
            <button
              onClick={() => navigate('/automation/workflows')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              View all
            </button>
          </div>

          {loadingWF ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recentWorkflows.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-10 h-10 mx-auto mb-2 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-sm">No workflows yet.</p>
              <button onClick={() => navigate('/automation/workflows')} className="btn-primary text-xs mt-3 px-4">
                Add Workflow
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentWorkflows.map(wf => (
                <div
                  key={wf.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${wf.status === 'Active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{wf.name}</p>
                    {wf.client_name && (
                      <p className="text-xs text-gray-400 truncate">{wf.client_name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {wf.department && (
                      <span className={`badge text-xs ${deptColor(wf.department)}`}>{wf.department}</span>
                    )}
                    <span className={`badge text-xs ${wf.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {wf.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Quick Links</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/automation/workflows')}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100 transition text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">Automation Workflows</p>
                <p className="text-xs text-blue-600 mt-0.5">{totalWorkflows} workflow{totalWorkflows !== 1 ? 's' : ''} configured</p>
              </div>
              <svg className="w-4 h-4 text-blue-400 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => navigate('/automation/flows')}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border border-purple-100 bg-purple-50 hover:bg-purple-100 transition text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-purple-900">Automation Flows</p>
                <p className="text-xs text-purple-600 mt-0.5">{totalFlows} rule{totalFlows !== 1 ? 's' : ''} &middot; {activeFlows} active</p>
              </div>
              <svg className="w-4 h-4 text-purple-400 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Summary breakdown */}
          {!loadingWF && totalWorkflows > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Workflow Status</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Active</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{activeWorkflows}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-300 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Inactive</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{inactiveWorkflows}</span>
                </div>
              </div>
              {/* Bar */}
              {totalWorkflows > 0 && (
                <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-green-500 rounded-l-full"
                    style={{ width: `${(activeWorkflows / totalWorkflows) * 100}%` }}
                  />
                  <div
                    className="h-full bg-gray-300"
                    style={{ width: `${(inactiveWorkflows / totalWorkflows) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
