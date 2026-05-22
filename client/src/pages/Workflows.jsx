import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const DEPT_COLORS = {
  Finance: 'bg-green-100 text-green-700', HR: 'bg-purple-100 text-purple-700', Operations: 'bg-blue-100 text-blue-700',
  IT: 'bg-cyan-100 text-cyan-700', Marketing: 'bg-pink-100 text-pink-700', Sales: 'bg-orange-100 text-orange-700', Default: 'bg-gray-100 text-gray-600'
}
const deptColor = (d) => DEPT_COLORS[d] || DEPT_COLORS.Default

function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={onChange} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300'}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  )
}

const emptyForm = { name: '', description: '', department: '', client_name: '', url: '', tags: '', status: 'Active' }

function WorkflowModal({ workflow, onClose, onSave }) {
  const [form, setForm] = useState(workflow ? { ...workflow, tags: Array.isArray(workflow.tags) ? workflow.tags.join(', ') : workflow.tags } : emptyForm)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); if (errors[k]) setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Workflow name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }
      if (workflow?.id) await axios.put(`/api/workflows/${workflow.id}`, payload)
      else await axios.post('/api/workflows', payload)
      toast.success(workflow ? 'Workflow updated' : 'Workflow created')
      onSave()
    } catch { toast.error('Failed to save workflow') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900">{workflow ? 'Edit Workflow' : 'Add New Workflow'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Workflow Name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={e => set('name', e.target.value)} className={`input-field ${errors.name ? 'input-error' : ''}`} placeholder="e.g. Invoice Processing" />
            {errors.name && <p className="error-msg">{errors.name}</p>}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} className="input-field resize-none" rows={2} placeholder="Brief description of what this workflow does..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Department</label>
              <select value={form.department} onChange={e => set('department', e.target.value)} className="input-field">
                <option value="">— Select —</option>
                {['Finance', 'HR', 'Operations', 'IT', 'Marketing', 'Sales'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className="input-field">
                <option>Active</option><option>Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Client Name</label>
            <input value={form.client_name} onChange={e => set('client_name', e.target.value)} className="input-field" placeholder="e.g. ABC Corp (or Internal)" />
          </div>
          <div>
            <label className="label">Webhook / Link URL</label>
            <input value={form.url} onChange={e => set('url', e.target.value)} className="input-field" placeholder="https://n8n.example.com/webhook/..." />
          </div>
          <div>
            <label className="label">Tags <span className="text-xs text-gray-400">(comma-separated)</span></label>
            <input value={form.tags} onChange={e => set('tags', e.target.value)} className="input-field" placeholder="e.g. Finance, Email, Scheduled" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
            {workflow ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Workflows() {
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('card')
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modal, setModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [departments, setDepartments] = useState([])

  const fetchWorkflows = async () => {
    setLoading(true)
    try {
      const r = await axios.get('/api/workflows', { params: { search, department: filterDept, status: filterStatus } })
      setWorkflows(r.data)
    } catch { toast.error('Failed to load workflows') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    axios.get('/api/workflows/meta/departments').then(r => setDepartments(r.data)).catch(() => {})
  }, [])

  useEffect(() => { fetchWorkflows() }, [search, filterDept, filterStatus])

  const handleToggleStatus = async (wf) => {
    const newStatus = wf.status === 'Active' ? 'Inactive' : 'Active'
    try {
      await axios.patch(`/api/workflows/${wf.id}/status`, { status: newStatus })
      setWorkflows(ws => ws.map(w => w.id === wf.id ? { ...w, status: newStatus } : w))
    } catch { toast.error('Failed to update status') }
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/workflows/${id}`)
      toast.success('Workflow deleted')
      setDeleteConfirm(null)
      fetchWorkflows()
    } catch { toast.error('Failed to delete') }
  }

  const copyURL = (url) => {
    navigator.clipboard.writeText(url).then(() => toast.success('URL copied!')).catch(() => toast.error('Copy failed'))
  }

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automation Workflows</h1>
          <p className="text-gray-500 text-sm mt-1">{workflows.length} workflow{workflows.length !== 1 ? 's' : ''} configured</p>
        </div>
        <button onClick={() => setModal({ editing: null })} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Workflow
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Search workflows..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9 text-sm" />
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="input-field text-sm w-40">
          <option value="">All Departments</option>
          {departments.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field text-sm w-36">
          <option value="">All Status</option>
          <option>Active</option><option>Inactive</option>
        </select>
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          {[['card', <svg key="c" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>], ['list', <svg key="l" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>]].map(([mode, icon]) => (
            <button key={mode} onClick={() => setViewMode(mode)} className={`px-3 py-2 flex items-center transition ${viewMode === mode ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>{icon}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : workflows.length === 0 ? (
        <div className="card p-16 text-center text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          <p className="text-sm">No workflows found. Add your first workflow!</p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {workflows.map(wf => (
            <div key={wf.id} className="card p-5 hover:shadow-md transition-shadow flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">{wf.name}</h3>
                  {wf.client_name && <p className="text-xs text-gray-400 mt-0.5">{wf.client_name}</p>}
                </div>
                <Toggle checked={wf.status === 'Active'} onChange={() => handleToggleStatus(wf)} />
              </div>

              {wf.description && <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{wf.description}</p>}

              <div className="flex flex-wrap gap-1.5">
                {wf.department && <span className={`badge text-xs ${deptColor(wf.department)}`}>{wf.department}</span>}
                {wf.tags?.map(t => <span key={t} className="badge bg-gray-100 text-gray-600 text-xs">{t}</span>)}
              </div>

              {wf.url && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <a href={wf.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs truncate flex-1 font-mono">{wf.url}</a>
                  <button onClick={() => copyURL(wf.url)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-400">{new Date(wf.created_at).toLocaleDateString()}</span>
                <div className="flex gap-1">
                  <button onClick={() => setModal({ editing: wf })} className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition font-medium">Edit</button>
                  <button onClick={() => setDeleteConfirm(wf.id)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition font-medium">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>{['Name', 'Department', 'Client', 'Status', 'URL', 'Created', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {workflows.map(wf => (
                  <tr key={wf.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{wf.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{wf.description}</div>
                    </td>
                    <td className="px-4 py-3">{wf.department && <span className={`badge ${deptColor(wf.department)}`}>{wf.department}</span>}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{wf.client_name || '—'}</td>
                    <td className="px-4 py-3"><Toggle checked={wf.status === 'Active'} onChange={() => handleToggleStatus(wf)} /></td>
                    <td className="px-4 py-3">
                      {wf.url ? (
                        <div className="flex items-center gap-1">
                          <a href={wf.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs font-mono max-w-48 truncate block">{wf.url}</a>
                          <button onClick={() => copyURL(wf.url)} className="text-gray-400 hover:text-gray-600 ml-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(wf.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setModal({ editing: wf })} className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition">Edit</button>
                        <button onClick={() => setDeleteConfirm(wf.id)} className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && <WorkflowModal workflow={modal.editing} onClose={() => setModal(null)} onSave={() => { setModal(null); fetchWorkflows() }} />}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></div>
              <div><h3 className="font-semibold text-gray-900">Delete Workflow</h3><p className="text-sm text-gray-500">This cannot be undone.</p></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger flex-1 text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
