import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'

const FIELD_TYPES = [
  { type: 'text',     label: 'Short Text',      abbr: 'Aa' },
  { type: 'textarea', label: 'Long Text',        abbr: '¶' },
  { type: 'email',    label: 'Email',            abbr: '@' },
  { type: 'phone',    label: 'Phone',            abbr: '☎' },
  { type: 'number',   label: 'Number',           abbr: '#' },
  { type: 'date',     label: 'Date',             abbr: '📅' },
  { type: 'select',   label: 'Dropdown',         abbr: '▾' },
  { type: 'radio',    label: 'Multiple Choice',  abbr: '◉' },
  { type: 'checkbox', label: 'Checkboxes',       abbr: '☑' },
  { type: 'file',     label: 'File Upload',      abbr: '📎' },
  { type: 'table',    label: 'Table',            abbr: '⊞' },
]

const COLORS = [
  { value: 'blue',   cls: 'bg-blue-500' },
  { value: 'purple', cls: 'bg-purple-500' },
  { value: 'green',  cls: 'bg-green-500' },
  { value: 'orange', cls: 'bg-orange-500' },
  { value: 'red',    cls: 'bg-red-500' },
  { value: 'pink',   cls: 'bg-pink-500' },
]

const ICONS = ['📋', '📝', '📄', '📊', '📌', '🗂️', '✅', '🔖', '💼', '📧', '🎓', '💰']
const DEPARTMENTS = ['HR', 'Finance', 'Operations', 'Training', 'Marketing', 'IT', 'Legal', 'Custom']

const DEFAULT_LABEL = {
  text: 'Text Field', textarea: 'Description', email: 'Email Address',
  phone: 'Phone Number', number: 'Number', date: 'Date',
  select: 'Select One', radio: 'Choose One', checkbox: 'Select All That Apply',
  file: 'File Upload', table: 'Table',
}

const DEFAULT_FIELD = (type) => ({
  id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  type,
  label: DEFAULT_LABEL[type] || 'Field',
  placeholder: '',
  required: false,
  options: ['select', 'radio', 'checkbox'].includes(type) ? ['Option 1', 'Option 2', 'Option 3'] : [],
  columns: type === 'table' ? ['Column 1', 'Column 2', 'Column 3'] : [],
})

function FieldCard({ field, index, total, isActive, onToggle, onUpdate, onRemove, onMove }) {
  const ft = FIELD_TYPES.find(t => t.type === field.type)
  const hasOptions = ['select', 'radio', 'checkbox'].includes(field.type)
  const hasPlaceholder = ['text', 'textarea', 'email', 'phone', 'number'].includes(field.type)
  const isTable = field.type === 'table'

  const updateOption = (i, val) => { const o = [...field.options]; o[i] = val; onUpdate({ options: o }) }
  const addOption = () => onUpdate({ options: [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`] })
  const removeOption = (i) => onUpdate({ options: field.options.filter((_, idx) => idx !== i) })

  const updateCol = (i, val) => { const c = [...(field.columns || [])]; c[i] = val; onUpdate({ columns: c }) }
  const addCol = () => onUpdate({ columns: [...(field.columns || []), `Column ${(field.columns?.length || 0) + 1}`] })
  const removeCol = (i) => onUpdate({ columns: (field.columns || []).filter((_, idx) => idx !== i) })

  return (
    <div className={`card border transition-all ${isActive ? 'border-blue-300 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
      <div className="flex items-center gap-3 p-4 cursor-pointer select-none" onClick={onToggle}>
        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-sm font-bold text-blue-600 flex-shrink-0">{index + 1}</div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate">{field.label || '(Untitled)'}</p>
          <p className="text-xs text-gray-400 mt-0.5">{ft?.label}{field.required ? ' · Required' : ''}{isTable ? ` · ${field.columns?.length || 0} cols` : ''}</p>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button onClick={e => { e.stopPropagation(); onMove(-1) }} disabled={index === 0} title="Move up"
            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-25 transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
          </button>
          <button onClick={e => { e.stopPropagation(); onMove(1) }} disabled={index === total - 1} title="Move down"
            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-25 transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          <button onClick={e => { e.stopPropagation(); onRemove() }} title="Delete field"
            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
          <svg className={`w-4 h-4 text-gray-400 ml-1 transition-transform ${isActive ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>

      {isActive && (
        <div className="border-t border-gray-100 bg-gray-50 rounded-b-xl p-4 space-y-3">
          <div className={`grid gap-3 ${hasPlaceholder ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Label</label>
              <input className="input text-sm" value={field.label} placeholder="Field label"
                onChange={e => onUpdate({ label: e.target.value })} />
            </div>
            {hasPlaceholder && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Placeholder / Hint</label>
                <input className="input text-sm" value={field.placeholder || ''} placeholder="Hint shown inside the field"
                  onChange={e => onUpdate({ placeholder: e.target.value })} />
              </div>
            )}
          </div>

          {hasOptions && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Options</label>
              <div className="space-y-1.5">
                {(field.options || []).map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input className="input text-sm flex-1 py-1.5" value={opt} placeholder={`Option ${oi + 1}`}
                      onChange={e => updateOption(oi, e.target.value)} />
                    <button onClick={() => removeOption(oi)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
                <button onClick={addOption} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 py-1 px-2 rounded hover:bg-blue-50 transition">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Option
                </button>
              </div>
            </div>
          )}

          {isTable && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Table Columns</label>
              <div className="space-y-1.5">
                {(field.columns || []).map((col, ci) => (
                  <div key={ci} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5 flex-shrink-0">{ci + 1}</span>
                    <input className="input text-sm flex-1 py-1.5" value={col} placeholder={`Column ${ci + 1}`}
                      onChange={e => updateCol(ci, e.target.value)} />
                    <button onClick={() => removeCol(ci)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
                <button onClick={addCol} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 py-1 px-2 rounded hover:bg-blue-50 transition">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Column
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Users can add/remove rows when filling this form.</p>
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
            <input type="checkbox" checked={field.required} onChange={e => onUpdate({ required: e.target.checked })} className="rounded text-blue-600 w-4 h-4" />
            <span className="text-xs font-medium text-gray-700">Required field</span>
          </label>
        </div>
      )}
    </div>
  )
}

export default function FormBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [activePage, setActivePage] = useState(0)
  const [activeField, setActiveField] = useState(null)
  const [form, setForm] = useState({
    name: '', description: '', department: 'Custom', color: 'blue', icon: '📋',
    pages: [{ id: `p_${Date.now()}`, name: 'Page 1', fields: [] }]
  })

  useEffect(() => {
    if (id) {
      axios.get(`/api/custom-forms/${id}`).then(r => {
        const data = r.data
        // Migrate legacy flat-fields forms to pages structure
        if (!data.pages?.length && data.fields?.length) {
          data.pages = [{ id: `p_${Date.now()}`, name: 'Page 1', fields: data.fields }]
        }
        if (!data.pages?.length) {
          data.pages = [{ id: `p_${Date.now()}`, name: 'Page 1', fields: [] }]
        }
        setForm(data)
      }).catch(() => toast.error('Failed to load form'))
    }
  }, [id])

  const currentFields = form.pages[activePage]?.fields || []
  const totalFields = form.pages.reduce((s, p) => s + p.fields.length, 0)

  const updatePages = (fn) => setForm(f => ({ ...f, pages: fn(f.pages) }))

  const addPage = () => {
    const newPage = { id: `p_${Date.now()}`, name: `Page ${form.pages.length + 1}`, fields: [] }
    updatePages(pages => [...pages, newPage])
    setActivePage(form.pages.length)
    setActiveField(null)
  }

  const renamePage = (idx, name) => updatePages(pages => pages.map((p, i) => i === idx ? { ...p, name } : p))

  const removePage = (idx) => {
    if (form.pages.length === 1) return toast.error('Must have at least one page')
    updatePages(pages => pages.filter((_, i) => i !== idx))
    setActivePage(Math.max(0, activePage - (idx <= activePage ? 1 : 0)))
    setActiveField(null)
  }

  const addField = (type) => {
    const newField = DEFAULT_FIELD(type)
    updatePages(pages => pages.map((p, i) => i === activePage ? { ...p, fields: [...p.fields, newField] } : p))
    setActiveField(newField.id)
    setTimeout(() => document.getElementById('fields-end')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const updateField = (fieldId, updates) => {
    updatePages(pages => pages.map((p, i) => i === activePage
      ? { ...p, fields: p.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f) }
      : p
    ))
  }

  const removeField = (fieldId) => {
    updatePages(pages => pages.map((p, i) => i === activePage ? { ...p, fields: p.fields.filter(f => f.id !== fieldId) } : p))
    if (activeField === fieldId) setActiveField(null)
  }

  const moveField = (fieldId, direction) => {
    updatePages(pages => pages.map((p, pi) => {
      if (pi !== activePage) return p
      const idx = p.fields.findIndex(f => f.id === fieldId)
      const target = idx + direction
      if (target < 0 || target >= p.fields.length) return p
      const arr = [...p.fields];
      [arr[idx], arr[target]] = [arr[target], arr[idx]]
      return { ...p, fields: arr }
    }))
  }

  const save = async () => {
    if (!form.name.trim()) return toast.error('Form name is required')
    if (totalFields === 0) return toast.error('Add at least one field')
    setSaving(true)
    try {
      const payload = { ...form }
      if (id) {
        await axios.put(`/api/custom-forms/${id}`, payload)
        toast.success('Form updated!')
      } else {
        await axios.post('/api/custom-forms', payload)
        toast.success('Form created!')
      }
      navigate('/forms')
    } catch {
      toast.error('Failed to save form')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/forms')} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Forms
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900 hidden sm:block">{id ? 'Edit Form' : 'Create Form'}</h1>
          <span className="text-sm text-gray-400">{form.pages.length} page{form.pages.length !== 1 ? 's' : ''} · {totalFields} field{totalFields !== 1 ? 's' : ''}</span>
          <button onClick={save} disabled={saving} className="btn-primary px-5">
            {saving ? 'Saving...' : id ? 'Update Form' : 'Create Form'}
          </button>
        </div>
      </div>

      {/* Form Details */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Form Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Form Name <span className="text-red-500">*</span></label>
            <input className="input" placeholder="e.g. Customer Feedback Form"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
            <select className="input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea rows={2} className="input resize-none" placeholder="Brief description of this form's purpose"
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="flex items-start gap-8 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Card Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c.value} type="button" title={c.value}
                  onClick={() => setForm(f => ({ ...f, color: c.value }))}
                  className={`w-6 h-6 rounded-full ${c.cls} transition-all ${form.color === c.value ? 'ring-2 ring-offset-2 ring-gray-500 scale-110' : 'hover:scale-110'}`} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
            <div className="flex gap-1 flex-wrap max-w-xs">
              {ICONS.map(icon => (
                <button key={icon} type="button" onClick={() => setForm(f => ({ ...f, icon }))}
                  className={`w-8 h-8 text-base flex items-center justify-center rounded-lg transition ${form.icon === icon ? 'bg-blue-100 ring-1 ring-blue-400' : 'hover:bg-gray-100'}`}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pages tabs */}
      <div className="card p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">Pages:</span>
          {form.pages.map((page, idx) => (
            <div key={page.id} className={`flex items-center gap-1 rounded-lg border transition ${activePage === idx ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
              <button onClick={() => { setActivePage(idx); setActiveField(null) }}
                className={`px-3 py-1.5 text-sm font-medium ${activePage === idx ? 'text-blue-700' : 'text-gray-600'}`}>
                {page.name}
                <span className="ml-1.5 text-xs opacity-60">({page.fields.length})</span>
              </button>
              {form.pages.length > 1 && (
                <button onClick={() => removePage(idx)} title="Remove page"
                  className="pr-2 text-gray-300 hover:text-red-400 transition text-lg leading-none">×</button>
              )}
            </div>
          ))}
          <button onClick={addPage}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 border border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition font-medium">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Page
          </button>
        </div>
        {/* Page name editor */}
        <div className="mt-3 flex items-center gap-2">
          <label className="text-xs text-gray-500 flex-shrink-0">Page name:</label>
          <input className="input text-sm py-1 flex-1 max-w-xs"
            value={form.pages[activePage]?.name || ''}
            onChange={e => renamePage(activePage, e.target.value)} />
        </div>
      </div>

      {/* Add Fields palette */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Fields to <span className="text-blue-600 ml-1">{form.pages[activePage]?.name}</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {FIELD_TYPES.map(ft => (
            <button key={ft.type} onClick={() => addField(ft.type)}
              className="flex flex-col items-center gap-1.5 p-3 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition group">
              <span className="text-lg font-semibold text-gray-500 group-hover:text-blue-600 leading-none">{ft.abbr}</span>
              <span className="text-xs font-medium text-gray-500 group-hover:text-blue-700 text-center leading-tight">{ft.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Fields list for active page */}
      {currentFields.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900">{form.pages[activePage]?.name} — Fields ({currentFields.length})</h2>
          {currentFields.map((field, index) => (
            <FieldCard
              key={field.id}
              field={field}
              index={index}
              total={currentFields.length}
              isActive={activeField === field.id}
              onToggle={() => setActiveField(activeField === field.id ? null : field.id)}
              onUpdate={updates => updateField(field.id, updates)}
              onRemove={() => removeField(field.id)}
              onMove={dir => moveField(field.id, dir)}
            />
          ))}
          <div id="fields-end" />
        </div>
      ) : (
        <div className="card p-12 text-center border-2 border-dashed border-gray-200">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <p className="text-gray-400 text-sm font-medium">No fields on this page yet</p>
          <p className="text-gray-300 text-xs mt-1">Click a field type above to add</p>
        </div>
      )}
    </div>
  )
}
