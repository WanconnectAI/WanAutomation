import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

// ── Column definitions for each base form ─────────────────────────────────────
const BASE_FORM_COLUMNS = {
  job_application: [
    { key: 'nameNRIC',    label: 'Full Name' },
    { key: 'email',       label: 'Email' },
    { key: 'phoneNumber', label: 'Phone' },
    { key: 'applyingFor', label: 'Applying For' },
    { key: 'branch',      label: 'Branch' },
    { key: 'nric',        label: 'NRIC' },
    { key: 'dob',         label: 'Date of Birth' },
  ],
  seminar_registration: [
    { key: 'fullName',    label: 'Full Name' },
    { key: 'email',       label: 'Email' },
    { key: 'phone',       label: 'Phone' },
    { key: 'department',  label: 'Department / Company' },
    { key: 'seminarName', label: 'Seminar Name' },
    { key: 'date',        label: 'Seminar Date' },
    { key: 'dietaryRequirements', label: 'Dietary' },
  ],
  staff_claim: [
    { key: 'staffName',   label: 'Staff Name' },
    { key: 'staffId',     label: 'Staff ID' },
    { key: 'department',  label: 'Department' },
    { key: 'claimType',   label: 'Claim Type' },
    { key: 'amount',      label: 'Amount (RM)' },
    { key: 'receiptDate', label: 'Receipt Date' },
    { key: 'description', label: 'Description' },
  ],
  client_request: [
    { key: 'clientName',  label: 'Client Name' },
    { key: 'company',     label: 'Company' },
    { key: 'email',       label: 'Email' },
    { key: 'phone',       label: 'Phone' },
    { key: 'requestType', label: 'Request Type' },
    { key: 'priority',    label: 'Priority' },
    { key: 'description', label: 'Description' },
  ],
}

const BASE_FORMS = [
  { value: 'job_application',      label: 'Job Application',      icon: '💼', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { value: 'seminar_registration', label: 'Seminar Registration', icon: '🎓', color: 'bg-green-50 border-green-200 text-green-700' },
  { value: 'staff_claim',          label: 'Staff Claim',          icon: '🧾', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { value: 'client_request',       label: 'Client Request',       icon: '📋', color: 'bg-blue-50 border-blue-200 text-blue-700' },
]

const PAGE_SIZE = 10

function camelToLabel(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim()
}

function parseData(raw) {
  try { return typeof raw === 'string' ? JSON.parse(raw) : (raw || {}) } catch { return {} }
}

function getCellValue(data, key) {
  const parsed = parseData(data)
  const val = parsed[key]
  if (val === null || val === undefined || val === '') return '—'
  if (typeof val === 'object' && !Array.isArray(val)) return JSON.stringify(val)
  if (Array.isArray(val)) return val.join(', ')
  if (typeof val === 'string' && val.startsWith('data:image')) return '[Signature]'
  return String(val)
}

// ── View Modal ────────────────────────────────────────────────────────────────
function ViewModal({ submission, formLabel, onClose }) {
  if (!submission) return null
  const data = parseData(submission.data)
  const files = data._files || {}

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
          <div>
            <h3 className="font-semibold text-gray-900">Submission #{submission.id}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {formLabel} · {new Date(submission.submitted_at).toLocaleString('en-MY')} · {submission.submitted_by}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {submission.pdf_path && (
              <a href={submission.pdf_path.startsWith('http') ? submission.pdf_path : `/${submission.pdf_path}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5z" />
                </svg>
                PDF
              </a>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          <div className="space-y-1">
            {Object.entries(data).filter(([k]) => !k.startsWith('_')).map(([k, v]) => {
              const isSig = typeof v === 'string' && v.startsWith('data:image')
              const isArrayOfObj = Array.isArray(v) && v.length > 0 && typeof v[0] === 'object'
              const isSimpleArray = Array.isArray(v) && !isArrayOfObj
              const isObj = !Array.isArray(v) && typeof v === 'object' && v !== null
              return (
                <div key={k} className="py-2 border-b border-gray-50">
                  <span className="font-medium text-gray-400 text-xs uppercase tracking-wide">{camelToLabel(k)}</span>
                  <div className="mt-1">
                    {isSig ? (
                      <img src={v} alt="Signature" className="h-12 border border-gray-200 rounded" />
                    ) : isArrayOfObj ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border border-gray-200 rounded mt-1">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-1 text-left text-gray-500 font-semibold">#</th>
                              {Object.keys(v[0]).map(col => <th key={col} className="px-2 py-1 text-left text-gray-500 font-semibold whitespace-nowrap">{camelToLabel(col)}</th>)}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {v.map((row, i) => (
                              <tr key={i} className="hover:bg-gray-50">
                                <td className="px-2 py-1 text-gray-400">{i + 1}</td>
                                {Object.values(row).map((cell, j) => (
                                  <td key={j} className="px-2 py-1 text-gray-700">{Array.isArray(cell) ? cell.join(', ') : String(cell ?? '—')}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : isSimpleArray ? (
                      <span className="text-gray-800 text-sm">{v.join(', ') || '—'}</span>
                    ) : isObj ? (
                      <div className="space-y-0.5">
                        {Object.entries(v).map(([ek, ev]) => (
                          <div key={ek} className="text-sm text-gray-700"><span className="text-gray-400">{camelToLabel(ek)}: </span>{String(ev ?? '—')}</div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-800 text-sm break-words">{String(v ?? '—')}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {Object.keys(files).length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Attachments</p>
              <div className="space-y-1">
                {Object.entries(files).map(([field, list]) =>
                  list.map((f, i) => (
                    <a key={`${field}-${i}`} href={f.url || `/uploads/${f.filename}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline py-0.5">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      {camelToLabel(field)}: {f.originalname}
                    </a>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t flex-shrink-0">
          <button onClick={onClose} className="btn-secondary text-sm w-full">Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Delete Submission</h3>
            <p className="text-sm text-gray-500">This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1 text-sm">Cancel</button>
          <button onClick={onConfirm} className="flex-1 text-sm bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition">Delete</button>
        </div>
      </div>
    </div>
  )
}

// ── Form Selector ─────────────────────────────────────────────────────────────
function FormSelector({ customForms, onSelect }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Submission Details</h1>
        <p className="text-gray-500 text-sm mt-1">Select a form below to view its submissions</p>
      </div>

      {/* Base Forms */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Base Forms</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BASE_FORMS.map(form => (
            <button key={form.value} onClick={() => onSelect(form.value, form.label)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left hover:shadow-md transition-all group ${form.color}`}>
              <span className="text-3xl">{form.icon}</span>
              <div>
                <p className="font-semibold text-sm">{form.label}</p>
                <p className="text-xs opacity-70 mt-0.5">View submissions →</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Forms */}
      {customForms.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Custom Forms</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {customForms.map(cf => (
              <button key={cf.id} onClick={() => onSelect(`custom_${cf.id}`, cf.name)}
                className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-left hover:shadow-md hover:border-blue-300 hover:bg-blue-50 transition-all">
                <span className="text-3xl">{cf.icon || '📋'}</span>
                <div>
                  <p className="font-semibold text-sm text-gray-800">{cf.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">View submissions →</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SubmissionsPage() {
  const [customForms, setCustomForms] = useState([])
  const [selectedType, setSelectedType] = useState('')   // '' = not selected yet
  const [selectedLabel, setSelectedLabel] = useState('')
  const [columns, setColumns] = useState([])             // dynamic columns for selected form
  const [submissions, setSubmissions] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [viewModal, setViewModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Load custom forms list
  useEffect(() => {
    axios.get('/api/custom-forms').then(r => setCustomForms(r.data || [])).catch(() => {})
  }, [])

  // Build columns when form type changes
  useEffect(() => {
    if (!selectedType) { setColumns([]); return }

    if (BASE_FORM_COLUMNS[selectedType]) {
      setColumns(BASE_FORM_COLUMNS[selectedType])
      return
    }

    // Custom form — get fields from API
    if (selectedType.startsWith('custom_')) {
      const id = selectedType.replace('custom_', '')
      axios.get(`/api/custom-forms/${id}`)
        .then(r => {
          const fields = r.data.fields || []
          setColumns(fields.map(f => ({ key: f.name || f.id || f.label, label: f.label || camelToLabel(f.name || f.id || '') })))
        })
        .catch(() => setColumns([]))
    }
  }, [selectedType])

  // Fetch submissions when form/page/dates change
  const fetchSubmissions = useCallback(async () => {
    if (!selectedType) return
    setLoading(true)
    try {
      const params = { page, limit: PAGE_SIZE }
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      const r = await axios.get(`/api/forms/submissions/${selectedType}`, { params })
      setSubmissions(r.data.submissions || [])
      setTotal(r.data.total || 0)
      setPages(r.data.pages || 1)
    } catch {
      toast.error('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }, [selectedType, page, dateFrom, dateTo])

  useEffect(() => { fetchSubmissions() }, [fetchSubmissions])

  const handleSelectForm = (type, label) => {
    setSelectedType(type)
    setSelectedLabel(label)
    setPage(1)
    setDateFrom('')
    setDateTo('')
    setSubmissions([])
    setTotal(0)
  }

  const handleBack = () => {
    setSelectedType('')
    setSelectedLabel('')
    setColumns([])
    setSubmissions([])
    setTotal(0)
    setPage(1)
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/forms/submission/${deleteConfirm}`)
      toast.success('Submission deleted')
      setDeleteConfirm(null)
      fetchSubmissions()
    } catch {
      toast.error('Failed to delete submission')
    }
  }

  const handleExportCSV = () => {
    const token = localStorage.getItem('token')
    window.open(`/api/forms/export/${selectedType}?token=${token}`, '_blank')
  }

  const pageRange = () => {
    const range = []
    const start = Math.max(1, page - 2)
    const end = Math.min(pages, start + 4)
    for (let i = start; i <= end; i++) range.push(i)
    return range
  }

  // ── No form selected → show selector ──────────────────────────────────────
  if (!selectedType) {
    return (
      <div className="max-w-6xl">
        <FormSelector customForms={customForms} onSelect={handleSelectForm} />
        {viewModal && <ViewModal submission={viewModal} formLabel={selectedLabel} onClose={() => setViewModal(null)} />}
      </div>
    )
  }

  // ── Form selected → show table ─────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Forms
          </button>
          <span className="text-gray-300">|</span>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{selectedLabel}</h1>
            <p className="text-gray-500 text-xs mt-0.5">{total} submission{total !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Date filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label text-xs">Date From</label>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} className="input-field text-sm" />
          </div>
          <div>
            <label className="label text-xs">Date To</label>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} className="input-field text-sm" />
          </div>
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); setPage(1) }}
              className="text-sm text-gray-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition">
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 gap-3">
            <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-500 text-sm">Loading submissions…</span>
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <span className="text-4xl">📭</span>
            <p className="text-gray-500 text-sm">No submissions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide border-b">
                <tr>
                  <th className="px-4 py-3 text-left w-12">#</th>
                  {columns.map(col => (
                    <th key={col.key} className="px-4 py-3 text-left whitespace-nowrap">{col.label}</th>
                  ))}
                  <th className="px-4 py-3 text-left whitespace-nowrap">Submitted By</th>
                  <th className="px-4 py-3 text-left whitespace-nowrap">Date & Time</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submissions.map((sub, idx) => (
                  <tr key={sub.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    {columns.map(col => (
                      <td key={col.key} className="px-4 py-3 text-gray-700 max-w-[200px]">
                        <span className="truncate block" title={getCellValue(sub.data, col.key)}>
                          {getCellValue(sub.data, col.key)}
                        </span>
                      </td>
                    ))}
                    <td className="px-4 py-3 text-gray-600">{sub.submitted_by || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(sub.submitted_at).toLocaleString('en-MY')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setViewModal(sub)}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium">
                          View
                        </button>
                        <button onClick={() => setDeleteConfirm(sub.id)}
                          className="text-xs text-red-500 hover:text-red-700 hover:underline font-medium">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 text-xs">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1}
              className="px-2.5 py-1.5 rounded-lg border text-xs disabled:opacity-40 hover:bg-gray-50 transition">«</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-2.5 py-1.5 rounded-lg border text-xs disabled:opacity-40 hover:bg-gray-50 transition">‹</button>
            {pageRange().map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`px-3 py-1.5 rounded-lg border text-xs transition ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="px-2.5 py-1.5 rounded-lg border text-xs disabled:opacity-40 hover:bg-gray-50 transition">›</button>
            <button onClick={() => setPage(pages)} disabled={page === pages}
              className="px-2.5 py-1.5 rounded-lg border text-xs disabled:opacity-40 hover:bg-gray-50 transition">»</button>
          </div>
        </div>
      )}

      {viewModal && <ViewModal submission={viewModal} formLabel={selectedLabel} onClose={() => setViewModal(null)} />}
      {deleteConfirm && <DeleteModal onConfirm={handleDelete} onCancel={() => setDeleteConfirm(null)} />}
    </div>
  )
}
