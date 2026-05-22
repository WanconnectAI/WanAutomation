import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

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
      const r = await axios.get(`/api/forms/submissions/${formType}`, { params: { page, limit: 10, search } })
      setSubmissions(r.data.submissions)
      setTotal(r.data.total)
      setPages(r.data.pages)
    } catch { toast.error('Failed to load submissions') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [page, search, formType])

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/forms/submission/${id}`)
      toast.success('Submission deleted')
      setDeleteConfirm(null)
      fetchData()
    } catch { toast.error('Failed to delete') }
  }

  const handleExport = () => {
    window.open(`/api/forms/export/${formType}?token=${localStorage.getItem('token')}`, '_blank')
  }

  const parseData = (raw) => {
    try { return JSON.parse(raw) } catch { return {} }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{formName} — Submissions</h2>
          <p className="text-sm text-gray-500 mt-0.5">{total} total submission{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm py-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Export CSV
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input type="text" placeholder="Search submissions..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="input-field pl-9 text-sm" />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <p className="text-sm">No submissions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['#', 'Submitted By', 'Date & Time', 'Preview', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submissions.map(s => {
                  const data = parseData(s.data)
                  const preview = Object.entries(data).filter(([k]) => !k.startsWith('_')).slice(0, 2).map(([k, v]) => `${k}: ${String(v).slice(0, 30)}`).join(' | ')
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400">#{s.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-700">{s.submitted_by}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(s.submitted_at).toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-400 max-w-xs truncate text-xs">{preview || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setViewModal(s)} className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition">View</button>
                          <button onClick={() => setDeleteConfirm(s.id)} className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition">Delete</button>
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
            <p className="text-xs text-gray-500">Page {page} of {pages}</p>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">←</button>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`px-2.5 py-1 text-xs border rounded ${page === p ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 hover:bg-gray-50'}`}>{p}</button>
              ))}
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="px-2 py-1 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">→</button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && setViewModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="font-semibold text-gray-900">Submission #{viewModal.id}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{new Date(viewModal.submitted_at).toLocaleString()} · {viewModal.submitted_by}</p>
              </div>
              <button onClick={() => setViewModal(null)} className="text-gray-400 hover:text-gray-600 p-1"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="overflow-y-auto p-5">
              <div className="space-y-2">
                {Object.entries(parseData(viewModal.data)).filter(([k]) => !k.startsWith('_')).map(([k, v]) => (
                  <div key={k} className="flex gap-3 text-sm border-b border-gray-50 pb-2">
                    <span className="font-medium text-gray-600 min-w-40 capitalize">{k.replace(/_/g, ' ')}:</span>
                    <span className="text-gray-800 break-all">{typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t">
              <button onClick={() => setViewModal(null)} className="btn-secondary text-sm w-full">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
              <div><h3 className="font-semibold text-gray-900">Delete Submission</h3><p className="text-sm text-gray-500">This action cannot be undone.</p></div>
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
