import React, { useState, useMemo } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

function TableField({ field, value, onChange }) {
  const cols = field.columns?.length ? field.columns : ['Column 1']
  const rows = value || [cols.reduce((a, c) => ({ ...a, [c]: '' }), {})]

  const setCell = (rowIdx, col, val) => {
    const next = rows.map((r, i) => i === rowIdx ? { ...r, [col]: val } : r)
    onChange(next)
  }
  const addRow = () => onChange([...rows, cols.reduce((a, c) => ({ ...a, [c]: '' }), {})])
  const removeRow = (i) => { if (rows.length > 1) onChange(rows.filter((_, ri) => ri !== i)) }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            {cols.map(col => (
              <th key={col} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b border-gray-200">{col}</th>
            ))}
            <th className="w-8 border-b border-gray-200" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-gray-100 last:border-0">
              {cols.map(col => (
                <td key={col} className="px-2 py-1.5">
                  <input
                    type="text"
                    className="w-full text-sm px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                    value={row[col] || ''}
                    onChange={e => setCell(ri, col, e.target.value)}
                  />
                </td>
              ))}
              <td className="px-1 py-1.5 text-center">
                <button type="button" onClick={() => removeRow(ri)}
                  className="text-gray-300 hover:text-red-400 transition text-lg leading-none">×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={addRow}
        className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
        <span className="text-base leading-none">+</span> Add Row
      </button>
    </div>
  )
}

function FieldRenderer({ field, value, fileMap, onChange, onFileChange, error }) {
  if (field.type === 'table') {
    return <TableField field={field} value={value} onChange={onChange} />
  }
  return (
    <>
      {field.type === 'text' && (
        <input type="text" className={`input ${error ? 'border-red-400' : ''}`}
          placeholder={field.placeholder} value={value || ''}
          onChange={e => onChange(e.target.value)} />
      )}
      {field.type === 'textarea' && (
        <textarea rows={3} className={`input resize-none ${error ? 'border-red-400' : ''}`}
          placeholder={field.placeholder} value={value || ''}
          onChange={e => onChange(e.target.value)} />
      )}
      {field.type === 'email' && (
        <input type="email" className={`input ${error ? 'border-red-400' : ''}`}
          placeholder={field.placeholder || 'email@example.com'} value={value || ''}
          onChange={e => onChange(e.target.value)} />
      )}
      {field.type === 'phone' && (
        <input type="tel" className={`input ${error ? 'border-red-400' : ''}`}
          placeholder={field.placeholder || '+60 12-345 6789'} value={value || ''}
          onChange={e => onChange(e.target.value)} />
      )}
      {field.type === 'number' && (
        <input type="number" className={`input ${error ? 'border-red-400' : ''}`}
          placeholder={field.placeholder} value={value || ''}
          onChange={e => onChange(e.target.value)} />
      )}
      {field.type === 'date' && (
        <input type="date" className={`input ${error ? 'border-red-400' : ''}`}
          value={value || ''} onChange={e => onChange(e.target.value)} />
      )}
      {field.type === 'select' && (
        <select className={`input ${error ? 'border-red-400' : ''}`}
          value={value || ''} onChange={e => onChange(e.target.value)}>
          <option value="">— Please Select —</option>
          {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      )}
      {field.type === 'radio' && (
        <div className="space-y-2 pt-1">
          {(field.options || []).map(opt => (
            <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name={`field_${field.id}`} value={opt}
                checked={value === opt} onChange={() => onChange(opt)}
                className="text-blue-600 w-4 h-4" />
              <span className="text-sm text-gray-700">{opt}</span>
            </label>
          ))}
        </div>
      )}
      {field.type === 'checkbox' && (
        <div className="space-y-2 pt-1">
          {(field.options || []).map(opt => (
            <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" value={opt}
                checked={(value || []).includes(opt)}
                onChange={e => {
                  const cur = value || []
                  onChange(e.target.checked ? [...cur, opt] : cur.filter(v => v !== opt))
                }}
                className="text-blue-600 rounded w-4 h-4" />
              <span className="text-sm text-gray-700">{opt}</span>
            </label>
          ))}
        </div>
      )}
      {field.type === 'file' && (
        <input type="file" multiple
          className={`input py-2 text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 ${error ? 'border-red-400' : ''}`}
          onChange={e => onFileChange(e.target.files)} />
      )}
    </>
  )
}

export default function DynamicFormView({ formId, fields = [], pages = [], formName = 'Form' }) {
  const isMultiPage = pages.length > 0
  const resolvedPages = useMemo(() => {
    if (isMultiPage) return pages
    if (fields.length > 0) return [{ id: 'default', name: 'Form', fields }]
    return []
  }, [isMultiPage, pages, fields])

  const [currentPage, setCurrentPage] = useState(0)
  const [formData, setFormData] = useState({})
  const [fileMap, setFileMap] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})

  const totalPages = resolvedPages.length
  const activePage = resolvedPages[currentPage] || { fields: [] }

  const set = (fieldId, value) => {
    setFormData(d => ({ ...d, [fieldId]: value }))
    setErrors(e => { const n = { ...e }; delete n[fieldId]; return n })
  }

  const validatePage = (pageFields) => {
    const errs = {}
    pageFields.filter(f => f.required).forEach(f => {
      const val = formData[f.id]
      if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
        errs[f.id] = `${f.label} is required`
      }
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (!validatePage(activePage.fields)) { toast.error('Please fill in all required fields'); return }
    setCurrentPage(p => Math.min(p + 1, totalPages - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    setErrors({})
    setCurrentPage(p => Math.max(p - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validatePage(activePage.fields)) { toast.error('Please fill in all required fields'); return }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('form_type', `custom_${formId}`)
      fd.append('submitted_by', 'public')
      Object.entries(formData).forEach(([k, v]) => {
        if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object') {
          fd.append(k, JSON.stringify(v))
        } else {
          fd.append(k, Array.isArray(v) ? v.join(', ') : (v ?? ''))
        }
      })
      Object.entries(fileMap).forEach(([k, fileList]) => {
        Array.from(fileList).forEach(f => fd.append(k, f))
      })
      await axios.post('/api/forms/submit', fd)
      setSubmitted(true)
    } catch {
      toast.error('Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) return (
    <div className="card p-12 text-center max-w-2xl mx-auto mt-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Submitted Successfully!</h2>
      <p className="text-gray-500 text-sm">Thank you — your response has been recorded.</p>
    </div>
  )

  if (resolvedPages.length === 0) return (
    <div className="card p-12 text-center max-w-2xl mx-auto mt-8">
      <p className="text-gray-400">This form has no fields yet.</p>
    </div>
  )

  const isLastPage = currentPage === totalPages - 1

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar for multi-page */}
      {totalPages > 1 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">{activePage.name}</span>
            <span className="text-xs text-gray-500">Step {currentPage + 1} of {totalPages}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
            />
          </div>
          {totalPages > 1 && (
            <div className="flex gap-1 mt-2">
              {resolvedPages.map((p, i) => (
                <div key={p.id}
                  className={`flex-1 h-1 rounded-full transition-colors ${i <= currentPage ? 'bg-blue-500' : 'bg-gray-200'}`} />
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={isLastPage ? handleSubmit : e => { e.preventDefault(); handleNext() }}
        className="card p-8 space-y-5">
        <h2 className="text-xl font-bold text-gray-900">{formName}</h2>

        {activePage.fields.map(field => (
          <div key={field.id} className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <FieldRenderer
              field={field}
              value={formData[field.id]}
              fileMap={fileMap}
              onChange={val => set(field.id, val)}
              onFileChange={files => setFileMap(m => ({ ...m, [field.id]: files }))}
              error={errors[field.id]}
            />
            {errors[field.id] && <p className="text-xs text-red-500">{errors[field.id]}</p>}
          </div>
        ))}

        <div className="pt-2 flex gap-3">
          {currentPage > 0 && (
            <button type="button" onClick={handleBack}
              className="flex-1 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              ← Back
            </button>
          )}
          <button type="submit" disabled={submitting}
            className="btn-primary flex-1 py-3">
            {submitting ? 'Submitting...' : isLastPage ? 'Submit' : `Next →`}
          </button>
        </div>
      </form>
    </div>
  )
}
