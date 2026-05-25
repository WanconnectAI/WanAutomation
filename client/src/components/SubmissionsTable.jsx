import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

function fileUrl(f) {
  // R2 files have a full URL; legacy local files have a filename
  return f.url || `/uploads/${f.filename}`
}

function FileCell({ files }) {
  if (!files || !Object.keys(files).length) return <span className="text-gray-300">—</span>
  return (
    <div className="space-y-0.5">
      {Object.entries(files).map(([field, list]) =>
        list.map((f, i) => (
          <a key={`${field}-${i}`}
            href={fileUrl(f)} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="truncate max-w-[120px]">{f.originalname}</span>
          </a>
        ))
      )}
    </div>
  )
}

function PdfCell({ pdfPath, submissionId }) {
  const [ready, setReady] = useState(!!pdfPath)
  useEffect(() => { setReady(!!pdfPath) }, [pdfPath])

  if (!ready) {
    return (
      <span className="flex items-center gap-1 text-xs text-gray-400">
        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Generating…
      </span>
    )
  }
  const pdfUrl = pdfPath.startsWith('http') ? pdfPath : `/${pdfPath}`
  return (
    <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 hover:underline font-medium">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 17v-1h8v1H8zm0-3v-1h8v1H8zm0-3v-1h5v1H8z"/>
      </svg>
      View PDF
    </a>
  )
}

function formatCellValue(v) {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (Array.isArray(v)) {
    if (v.length === 0) return '—'
    if (typeof v[0] === 'object') return null // handled by ArrayCell
    return v.join(', ').slice(0, 80)
  }
  if (typeof v === 'object') return Object.entries(v).map(([k, val]) => `${camelToLabel(k)}: ${typeof val === 'object' ? JSON.stringify(val) : val}`).join(' · ').slice(0, 80)
  const s = String(v)
  if (s.startsWith('data:image')) return '[Signature]'
  return s.length > 80 ? s.slice(0, 80) + '…' : s
}

function ArrayCell({ rows }) {
  if (!rows || rows.length === 0) return <span className="text-gray-300">—</span>
  return (
    <div className="space-y-1.5 min-w-[200px]">
      {rows.map((row, i) => {
        const entries = Object.entries(row).filter(([, v]) => v !== null && v !== undefined && v !== '')
        return (
          <div key={i} className="text-xs border border-gray-100 rounded p-1.5 bg-gray-50">
            <span className="font-semibold text-gray-400 mr-1">#{i + 1}</span>
            {entries.map(([k, val], j) => {
              const display = Array.isArray(val)
                ? val.map(x => typeof x === 'object' && x ? Object.values(x).join('/') : x).join(', ')
                : typeof val === 'object' && val !== null
                  ? Object.entries(val).map(([ek, ev]) => `${camelToLabel(ek)}: ${ev}`).join(', ')
                  : String(val)
              return (
                <span key={k}>
                  <span className="text-gray-500">{camelToLabel(k)}:</span>{' '}
                  <span className="text-gray-700">{display}</span>
                  {j < entries.length - 1 ? <span className="text-gray-300 mx-1">·</span> : null}
                </span>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

function camelToLabel(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim()
}

export default function SubmissionsTable({ formType, formName }) {
  const [submissions, setSubmissions] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [viewModal, setViewModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const r = await axios.get(`/api/forms/submissions/${formType}`, { params: { page, limit: 20, search } })
      setSubmissions(r.data.submissions)
      setTotal(r.data.total)
      setPages(r.data.pages)
    } catch { toast.error('Failed to load submissions') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [page, search, formType])

  // Collect all unique field keys from all submissions
  const fieldKeys = useMemo(() => {
    const keys = new Set()
    submissions.forEach(s => {
      try {
        Object.keys(JSON.parse(s.data)).filter(k => !k.startsWith('_')).forEach(k => keys.add(k))
      } catch {}
    })
    return Array.from(keys)
  }, [submissions])

  const parseData = (raw) => { try { return JSON.parse(raw) } catch { return {} } }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/forms/submission/${id}`)
      toast.success('Submission deleted')
      setDeleteConfirm(null)
      fetchData()
    } catch { toast.error('Failed to delete') }
  }

  const handleExport = () => {
    const token = localStorage.getItem('token')
    window.open(`/api/forms/export/${formType}?token=${token}`, '_blank')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{formName} — Submissions</h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} total submission{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm py-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="Search submissions…" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="input pl-9 text-sm" />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">No submissions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: `${Math.max(800, fieldKeys.length * 140 + 400)}px` }}>
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide sticky left-0 bg-gray-50 z-10">#</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Submitted By</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Date & Time</th>
                  {fieldKeys.map(k => (
                    <th key={k} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {camelToLabel(k)}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Attachments</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-blue-600 uppercase tracking-wide whitespace-nowrap bg-blue-50">Form Submitted</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submissions.map(s => {
                  const data = parseData(s.data)
                  const files = data._files || {}
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5 text-gray-400 text-xs sticky left-0 bg-white group-hover:bg-gray-50">#{s.id}</td>
                      <td className="px-3 py-2.5 text-gray-700 text-xs font-medium whitespace-nowrap">{s.submitted_by}</td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs whitespace-nowrap">{new Date(s.submitted_at).toLocaleString('en-MY')}</td>
                      {fieldKeys.map(k => {
                        const val = data[k]
                        const isArrayOfObj = Array.isArray(val) && val.length > 0 && typeof val[0] === 'object'
                        return (
                          <td key={k} className="px-3 py-2.5 text-gray-600 text-xs align-top">
                            {isArrayOfObj
                              ? <ArrayCell rows={val} />
                              : <span className="block">{formatCellValue(val)}</span>
                            }
                          </td>
                        )
                      })}
                      <td className="px-3 py-2.5"><FileCell files={files} /></td>
                      <td className="px-3 py-2.5 bg-blue-50/50"><PdfCell pdfPath={s.pdf_path} submissionId={s.id} /></td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1.5">
                          <button onClick={() => setViewModal(s)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition">
                            View
                          </button>
                          <button onClick={() => setDeleteConfirm(s.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition">
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
            <p className="text-xs text-gray-500">Page {page} of {pages} · {total} total</p>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-2 py-1 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">←</button>
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-2.5 py-1 text-xs border rounded ${page === p ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 hover:bg-gray-50'}`}>
                  {p}
                </button>
              ))}
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
                className="px-2 py-1 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">→</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {viewModal && (() => {
        const data = parseData(viewModal.data)
        const files = data._files || {}
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={e => e.target === e.currentTarget && setViewModal(null)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
                <div>
                  <h3 className="font-semibold text-gray-900">Submission #{viewModal.id}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(viewModal.submitted_at).toLocaleString('en-MY')} · {viewModal.submitted_by}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {viewModal.pdf_path && (
                    <a href={`/${viewModal.pdf_path}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5z"/>
                      </svg>
                      Download PDF
                    </a>
                  )}
                  <button onClick={() => setViewModal(null)} className="text-gray-400 hover:text-gray-600 p-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 p-5">
                <div className="space-y-1">
                  {Object.entries(data).filter(([k]) => !k.startsWith('_')).map(([k, v]) => {
                    const isArrayOfObj = Array.isArray(v) && v.length > 0 && typeof v[0] === 'object'
                    const isSimpleArray = Array.isArray(v) && !isArrayOfObj
                    const isSig = typeof v === 'string' && v.startsWith('data:image')
                    const isObj = !Array.isArray(v) && typeof v === 'object' && v !== null

                    return (
                      <div key={k} className="py-2 border-b border-gray-50">
                        <span className="font-medium text-gray-500 text-xs uppercase tracking-wide">{camelToLabel(k)}</span>
                        <div className="mt-1">
                          {isSig ? (
                            <img src={v} alt="Signature" className="h-12 border border-gray-200 rounded" />
                          ) : isArrayOfObj ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs border border-gray-200 rounded">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-2 py-1 text-left text-gray-500 font-semibold">#</th>
                                    {Object.keys(v[0]).map(col => (
                                      <th key={col} className="px-2 py-1 text-left text-gray-500 font-semibold whitespace-nowrap">{camelToLabel(col)}</th>
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
                                  <span className="text-gray-400">{camelToLabel(ek)}: </span>{String(ev ?? '—')}
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
                        list.map((f, i) => (
                          <a key={`${field}-${i}`} href={fileUrl(f)} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline py-0.5">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span>{camelToLabel(field)}: {f.originalname}</span>
                            <span className="text-gray-400 text-xs">({Math.round((f.size || 0) / 1024)} KB)</span>
                          </a>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t flex-shrink-0">
                <button onClick={() => setViewModal(null)} className="btn-secondary text-sm w-full">Close</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Submission</h3>
                <p className="text-sm text-gray-500">This cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 text-sm py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
