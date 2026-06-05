import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const BASE_FORM_OPTIONS = [
  { value: 'all', label: 'All Forms' },
  { value: 'job_application', label: 'Job Application' },
  { value: 'seminar_registration', label: 'Seminar Registration' },
  { value: 'staff_claim', label: 'Staff Claim' },
  { value: 'client_request', label: 'Client Request' },
]

const FORM_LABELS = {
  job_application: 'Job Application',
  seminar_registration: 'Seminar Registration',
  staff_claim: 'Staff Claim',
  client_request: 'Client Request',
}

const PAGE_SIZE = 10

function camelToLabel(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim()
}

function formatPreview(data, maxFields = 3) {
  try {
    const obj = typeof data === 'string' ? JSON.parse(data) : data
    const entries = Object.entries(obj).filter(([k, v]) => !k.startsWith('_') && v !== null && v !== undefined && v !== '')
    return entries.slice(0, maxFields).map(([k, v]) => {
      let display = v
      if (typeof v === 'object' && !Array.isArray(v)) display = JSON.stringify(v)
      if (Array.isArray(v)) display = v.join(', ')
      if (typeof display === 'string' && display.startsWith('data:image')) display = '[Signature]'
      const str = String(display)
      return { key: camelToLabel(k), value: str.length > 40 ? str.slice(0, 40) + '…' : str }
    })
  } catch {
    return []
  }
}

function parseData(raw) {
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw } catch { return {} }
}

// ---- View Submission Modal ----
function ViewModal({ submission, onClose }) {
  if (!submission) return null
  const data = parseData(submission.data)
  const files = data._files || {}

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
          <div>
            <h3 className="font-semibold text-gray-900">Submission #{submission.id}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {FORM_LABELS[submission.form_type] || submission.form_type}
              {' · '}
              {new Date(submission.submitted_at).toLocaleString('en-MY')}
              {' · '}
              {submission.submitted_by}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {submission.pdf_path && (
              <a
                href={submission.pdf_path.startsWith('http') ? submission.pdf_path : `/${submission.pdf_path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition"
              >
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
            {Object.entries(data)
              .filter(([k]) => !k.startsWith('_'))
              .map(([k, v]) => {
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
                                {Object.keys(v[0]).map(col => (
                                  <th key={col} className="px-2 py-1 text-left text-gray-500 font-semibold whitespace-nowrap">
                                    {camelToLabel(col)}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {v.map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                  <td className="px-2 py-1 text-gray-400">{i + 1}</td>
                                  {Object.values(row).map((cell, j) => (
                                    <td key={j} className="px-2 py-1 text-gray-700">
                                      {Array.isArray(cell) ? cell.join(', ') : String(cell ?? '—')}
                                    </td>
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
                            <div key={ek} className="text-sm text-gray-700">
                              <span className="text-gray-400">{camelToLabel(ek)}: </span>
                              {String(ev ?? '—')}
                            </div>
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
                  list.map((f, i) => {
                    const url = f.url || `/uploads/${f.filename}`
                    return (
                      <a
                        key={`${field}-${i}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline py-0.5"
                      >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span>{camelToLabel(field)}: {f.originalname}</span>
                        <span className="text-gray-400 text-xs">({Math.round((f.size || 0) / 1024)} KB)</span>
                      </a>
                    )
                  })
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

// ---- Delete confirmation modal ----
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
          <button onClick={onConfirm} className="btn-danger flex-1 text-sm">Delete</button>
        </div>
      </div>
    </div>
  )
}

// ---- Main page ----
export default function SubmissionsPage() {
  const [formType, setFormType] = useState('all')
  const [customForms, setCustomForms] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [viewModal, setViewModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Load custom forms for the filter dropdown
  useEffect(() => {
    axios.get('/api/custom-forms').then(r => setCustomForms(r.data || [])).catch(() => {})
  }, [])

  const formOptions = [
    ...BASE_FORM_OPTIONS,
    ...customForms.map(cf => ({ value: `custom_${cf.id}`, label: cf.name })),
  ]

  const getFormLabel = (type) => {
    const opt = formOptions.find(o => o.value === type)
    return opt ? opt.label : (FORM_LABELS[type] || type)
  }

  // Build aggregate submissions from all types when "all" is selected
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const types = [
        'job_application',
        'seminar_registration',
        'staff_claim',
        'client_request',
        ...customForms.map(cf => `custom_${cf.id}`),
      ]
      const params = { page: 1, limit: 200 }
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo

      const results = await Promise.all(
        types.map(t =>
          axios.get(`/api/forms/submissions/${t}`, { params }).then(r =>
            (r.data.submissions || []).map(s => ({ ...s, form_type: s.form_type || t }))
          ).catch(() => [])
        )
      )
      const all = results.flat().sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
      const totalCount = all.length
      const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
      const safeePage = Math.min(page, totalPages)
      const slice = all.slice((safeePage - 1) * PAGE_SIZE, safeePage * PAGE_SIZE)
      setTotal(totalCount)
      setPages(totalPages)
      setSubmissions(slice)
    } catch {
      toast.error('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }, [customForms, dateFrom, dateTo, page])

  const fetchSingle = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: PAGE_SIZE }
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      const r = await axios.get(`/api/forms/submissions/${formType}`, { params })
      setSubmissions(r.data.submissions || [])
      setTotal(r.data.total || 0)
      setPages(r.data.pages || 1)
    } catch {
      toast.error('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }, [formType, page, dateFrom, dateTo])

  useEffect(() => {
    if (formType === 'all') {
      fetchAll()
    } else {
      fetchSingle()
    }
  }, [formType, page, dateFrom, dateTo, customForms])

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/forms/submission/${deleteConfirm}`)
      toast.success('Submission deleted')
      setDeleteConfirm(null)
      if (formType === 'all') fetchAll()
      else fetchSingle()
    } catch {
      toast.error('Failed to delete submission')
    }
  }

  const handleExportCSV = () => {
    const token = localStorage.getItem('token')
    if (formType === 'all') {
      toast('Select a specific form type to export CSV', { icon: 'ℹ️' })
      return
    }
    window.open(`/api/forms/export/${formType}?token=${token}`, '_blank')
  }

  const handleFilterChange = (field, value) => {
    setPage(1)
    if (field === 'formType') setFormType(value)
    if (field === 'dateFrom') setDateFrom(value)
    if (field === 'dateTo') setDateTo(value)
  }

  // Compute page range for pagination controls
  const pageRange = () => {
    const range = []
    const start = Math.max(1, page - 2)
    const end = Math.min(pages, start + 4)
    for (let i = start; i <= end; i++) range.push(i)
    return range
  }

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submission Details</h1>
          <p className="text-gray-500 text-sm mt-1">
            {total} submission{total !== 1 ? 's' : ''}{formType !== 'all' ? ` · ${getFormLabel(formType)}` : ' · All Forms'}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* Form type */}
          <div className="flex-1 min-w-44">
            <label className="label text-xs">Form Type</label>
            <select
              value={formType}
              onChange={e => handleFilterChange('formType', e.target.value)}
              className="input-field text-sm"
            >
              {formOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div className="flex-1 min-w-36">
            <label className="label text-xs">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => handleFilterChange('dateFrom', e.target.value)}
              className="input-field text-sm"
            />
          </div>

          {/* Date to */}
          <div className="flex-1 min-w-36">
            <label className="label text-xs">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => handleFilterChange('dateTo', e.target.value)}
              className="input-field text-sm"
            />
          </div>

          {/* Clear filters */}
          {(dateFrom || dateTo || formType !== 'all') && (
            <button
              onClick={() => { setFormType('all'); setDateFrom(''); setDateTo(''); setPage(1) }}
              className="btn-secondary text-sm h-[38px] flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-52">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium">No submissions found</p>
            <p className="text-xs mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-14">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Form</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitted By</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Date / Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Preview</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submissions.map(s => {
                  const preview = formatPreview(s.data, 3)
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono">#{s.id}</td>
                      <td className="px-4 py-3">
                        <span className="badge bg-blue-50 text-blue-700 text-xs whitespace-nowrap">
                          {getFormLabel(s.form_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs font-medium whitespace-nowrap">{s.submitted_by}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(s.submitted_at).toLocaleString('en-MY')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5 max-w-xs">
                          {preview.map((p, i) => (
                            <div key={i} className="text-xs">
                              <span className="text-gray-400">{p.key}: </span>
                              <span className="text-gray-700">{p.value}</span>
                            </div>
                          ))}
                          {preview.length === 0 && <span className="text-gray-300 text-xs">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setViewModal(s)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition"
                          >
                            View
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(s.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Page {page} of {pages} &middot; {total} total
            </p>
            <div className="flex gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(1)}
                className="px-2 py-1 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50"
              >
                «
              </button>
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-2 py-1 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50"
              >
                ‹
              </button>
              {pageRange().map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-2.5 py-1 text-xs border rounded ${page === p ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page === pages}
                onClick={() => setPage(p => p + 1)}
                className="px-2 py-1 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50"
              >
                ›
              </button>
              <button
                disabled={page === pages}
                onClick={() => setPage(pages)}
                className="px-2 py-1 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {viewModal && (
        <ViewModal submission={viewModal} onClose={() => setViewModal(null)} />
      )}
      {deleteConfirm && (
        <DeleteModal
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}
