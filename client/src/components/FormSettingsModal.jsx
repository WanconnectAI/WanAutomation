import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

// Fields exposed per form type for monday.com mapping
const FORM_FIELDS = {
  job_application: [
    { key: 'applyingFor', label: 'Position Applying For' },
    { key: 'nameNRIC', label: 'Full Name (NRIC)' },
    { key: 'email', label: 'Email' },
    { key: 'phoneNumber', label: 'Phone Number' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'nric', label: 'NRIC Number' },
    { key: 'maritalStatus', label: 'Marital Status' },
    { key: 'race', label: 'Race' },
    { key: 'highestEducation', label: 'Highest Education' },
    { key: 'expectedSalary', label: 'Expected Salary' },
    { key: 'startDate', label: 'Available Start Date' },
    { key: 'branch', label: 'Apply for Branch' },
  ],
  seminar_registration: [
    { key: 'fullName', label: 'Full Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'department', label: 'Department' },
    { key: 'seminarName', label: 'Seminar Name' },
    { key: 'date', label: 'Date' },
    { key: 'dietaryRequirements', label: 'Dietary Requirements' },
  ],
  staff_claim: [
    { key: 'staffName', label: 'Staff Name' },
    { key: 'staffId', label: 'Staff ID' },
    { key: 'department', label: 'Department' },
    { key: 'claimType', label: 'Claim Type' },
    { key: 'amount', label: 'Amount (RM)' },
    { key: 'receiptDate', label: 'Receipt Date' },
    { key: 'description', label: 'Description' },
  ],
  client_request: [
    { key: 'clientName', label: 'Client Name' },
    { key: 'company', label: 'Company' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'requestType', label: 'Request Type' },
    { key: 'priority', label: 'Priority' },
    { key: 'description', label: 'Description' },
  ],
}

const TABS = [
  { id: 'appearance', label: 'Appearance', icon: '🎨' },
  { id: 'sharing', label: 'Publish & Share', icon: '🔗' },
  { id: 'monday', label: 'Monday.com', icon: '📋' },
]

export default function FormSettingsModal({ form, onClose, onUpdate }) {
  const [tab, setTab] = useState('appearance')
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [fetchingCols, setFetchingCols] = useState(false)
  const [mondayColumns, setMondayColumns] = useState([])
  const [mondayBoardName, setMondayBoardName] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [mondayForm, setMondayForm] = useState({ monday_api_token: '', monday_board_id: '', monday_column_mappings: {} })
  const fileRef = useRef()

  const publicUrl = settings?.public_token ? `${window.location.origin}/f/${settings.public_token}` : ''

  useEffect(() => {
    axios.get(`/api/form-settings/${form.type}`)
      .then(r => {
        setSettings(r.data)
        setMondayForm({
          monday_api_token: r.data.monday_api_token || '',
          monday_board_id: r.data.monday_board_id || '',
          monday_column_mappings: r.data.monday_column_mappings || {}
        })
      })
      .catch(() => toast.error('Failed to load form settings'))
      .finally(() => setLoading(false))
  }, [form.type])

  const handleLogoUpload = async (file) => {
    if (!file) return
    setLogoUploading(true)
    try {
      const fd = new FormData()
      fd.append('logo', file)
      const r = await axios.post(`/api/form-settings/${form.type}/logo`, fd)
      setSettings(s => ({ ...s, logo_url: r.data.logo_url }))
      onUpdate()
      toast.success('Logo uploaded')
    } catch { toast.error('Logo upload failed') }
    finally { setLogoUploading(false) }
  }

  const handleRemoveLogo = async () => {
    try {
      await axios.delete(`/api/form-settings/${form.type}/logo`)
      setSettings(s => ({ ...s, logo_url: null }))
      onUpdate()
      toast.success('Logo removed')
    } catch { toast.error('Failed to remove logo') }
  }

  const handlePublishToggle = async () => {
    setPublishing(true)
    try {
      const r = await axios.post(`/api/form-settings/${form.type}/publish`, { publish: !settings.is_published })
      setSettings(s => ({ ...s, is_published: r.data.is_published, public_token: r.data.public_token }))
      onUpdate()
      toast.success(r.data.is_published ? 'Form published!' : 'Form unpublished')
    } catch { toast.error('Failed to update publish status') }
    finally { setPublishing(false) }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
      toast.success('Link copied!')
    })
  }

  const handleFetchColumns = async () => {
    if (!mondayForm.monday_api_token || !mondayForm.monday_board_id) {
      toast.error('Enter API Token and Board ID first')
      return
    }
    setFetchingCols(true)
    try {
      const r = await axios.get(`/api/form-settings/${form.type}/monday-columns`, {
        params: { apiToken: mondayForm.monday_api_token, boardId: mondayForm.monday_board_id }
      })
      setMondayColumns(r.data.columns)
      setMondayBoardName(r.data.boardName)
      toast.success(`Connected to "${r.data.boardName}" — ${r.data.columns.length} columns found`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch columns')
    }
    finally { setFetchingCols(false) }
  }

  const handleSaveMonday = async () => {
    setSaving(true)
    try {
      const r = await axios.put(`/api/form-settings/${form.type}`, {
        form_name: settings.form_name,
        monday_api_token: mondayForm.monday_api_token,
        monday_board_id: mondayForm.monday_board_id,
        monday_column_mappings: mondayForm.monday_column_mappings
      })
      setSettings(r.data)
      onUpdate()
      toast.success('Monday.com settings saved')
    } catch { toast.error('Failed to save settings') }
    finally { setSaving(false) }
  }

  const setMapping = (fieldKey, colId) => {
    setMondayForm(f => ({ ...f, monday_column_mappings: { ...f.monday_column_mappings, [fieldKey]: colId } }))
  }

  const formFields = FORM_FIELDS[form.type] || []

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Form Settings</h2>
            <p className="text-sm text-gray-400 mt-0.5">{form.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition -mb-px ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <>
              {/* ── APPEARANCE TAB ── */}
              {tab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Form Logo</h3>
                    <p className="text-sm text-gray-400 mb-4">This logo appears at the top of your form (recommended: 200×60px, PNG/JPG)</p>

                    {settings?.logo_url ? (
                      <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between bg-gray-50">
                        <img src={settings.logo_url} alt="Form logo" className="h-12 max-w-48 object-contain" />
                        <div className="flex gap-2">
                          <button onClick={() => fileRef.current?.click()} className="btn-secondary text-sm py-1.5 px-3">Change</button>
                          <button onClick={handleRemoveLogo} className="text-sm py-1.5 px-3 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition">Remove</button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition"
                        onClick={() => fileRef.current?.click()}
                        onDrop={e => { e.preventDefault(); handleLogoUpload(e.dataTransfer.files[0]) }}
                        onDragOver={e => e.preventDefault()}
                      >
                        {logoUploading ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-gray-400">Uploading...</p>
                          </div>
                        ) : (
                          <>
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                            <p className="text-sm font-medium text-gray-600">Drop your logo here or <span className="text-blue-600">browse</span></p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                          </>
                        )}
                      </div>
                    )}
                    <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={e => handleLogoUpload(e.target.files[0])} />
                  </div>

                  {/* Logo preview on form */}
                  {settings?.logo_url && (
                    <div className="border border-blue-100 rounded-xl p-4 bg-blue-50">
                      <p className="text-xs text-blue-600 font-medium mb-3">Preview — how it looks on the form</p>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <img src={settings.logo_url} alt="Preview" className="h-10 object-contain mb-3" />
                        <div className="h-1.5 bg-gray-100 rounded w-3/4" />
                        <div className="h-1.5 bg-gray-100 rounded w-1/2 mt-2" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── SHARING TAB ── */}
              {tab === 'sharing' && (
                <div className="space-y-6">
                  <div className="flex items-start justify-between p-5 border border-gray-200 rounded-xl">
                    <div>
                      <h3 className="font-semibold text-gray-800">Publish Form</h3>
                      <p className="text-sm text-gray-500 mt-1">When published, anyone with the link can fill this form without logging in.</p>
                      <div className={`mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${settings?.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${settings?.is_published ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {settings?.is_published ? 'Published' : 'Draft'}
                      </div>
                    </div>
                    <button
                      onClick={handlePublishToggle}
                      disabled={publishing}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 mt-1 ${settings?.is_published ? 'bg-green-500' : 'bg-gray-300'} disabled:opacity-50`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settings?.is_published ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {settings?.is_published && settings?.public_token && (
                    <>
                      <div className="space-y-2">
                        <label className="label">Public Share Link</label>
                        <div className="flex gap-2">
                          <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 gap-2 min-w-0">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                            <span className="text-sm text-blue-600 font-mono truncate">{publicUrl}</span>
                          </div>
                          <button onClick={copyLink} className={`btn-primary text-sm px-4 flex-shrink-0 flex items-center gap-1.5 ${linkCopied ? 'bg-green-600 hover:bg-green-700' : ''}`}>
                            {linkCopied ? (
                              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copied!</>
                            ) : (
                              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-gray-400">Share this link with anyone — no login required to submit</p>
                      </div>

                      <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        Open public form in new tab
                      </a>
                    </>
                  )}

                  {!settings?.is_published && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                      <strong>Tip:</strong> Enable the toggle above to generate a public share link. The link remains permanent even if you temporarily unpublish.
                    </div>
                  )}
                </div>
              )}

              {/* ── MONDAY.COM TAB ── */}
              {tab === 'monday' && (
                <div className="space-y-5">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-sm text-blue-700">When someone submits this form, a new item is automatically created on your monday.com board. Find your API token at <strong>Profile → Developers → API</strong>.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="label">Monday.com API Token</label>
                      <input type="password" value={mondayForm.monday_api_token} onChange={e => setMondayForm(f => ({ ...f, monday_api_token: e.target.value }))} className="input-field font-mono text-sm" placeholder="eyJhbGciOiJIUzI1NiJ9..." />
                    </div>
                    <div>
                      <label className="label">Board ID</label>
                      <input value={mondayForm.monday_board_id} onChange={e => setMondayForm(f => ({ ...f, monday_board_id: e.target.value }))} className="input-field" placeholder="e.g. 1234567890" />
                      <p className="text-xs text-gray-400 mt-1">Find it in the board URL: monday.com/boards/<strong>1234567890</strong></p>
                    </div>

                    <button onClick={handleFetchColumns} disabled={fetchingCols} className="btn-secondary flex items-center gap-2 text-sm">
                      {fetchingCols ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
                      {fetchingCols ? 'Connecting...' : 'Test Connection & Fetch Columns'}
                    </button>
                  </div>

                  {mondayColumns.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 text-sm">Field → Column Mapping</h3>
                        {mondayBoardName && <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">✓ {mondayBoardName}</span>}
                      </div>
                      <p className="text-xs text-gray-400">Map each form field to a monday.com column. Leave blank to skip.</p>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50"><tr>
                            <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">Form Field</th>
                            <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500">Monday.com Column</th>
                          </tr></thead>
                          <tbody className="divide-y divide-gray-100">
                            {formFields.map(f => (
                              <tr key={f.key} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-gray-700 font-medium text-xs">{f.label}</td>
                                <td className="px-3 py-2">
                                  <select value={mondayForm.monday_column_mappings[f.key] || ''} onChange={e => setMapping(f.key, e.target.value)} className="input-field text-xs py-1.5">
                                    <option value="">— Skip —</option>
                                    {mondayColumns.filter(c => c.id !== 'name').map(c => (
                                      <option key={c.id} value={c.id}>{c.title} ({c.type})</option>
                                    ))}
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {(mondayForm.monday_api_token || mondayForm.monday_board_id || mondayColumns.length > 0) && (
                    <button onClick={handleSaveMonday} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
                      {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                      {saving ? 'Saving...' : 'Save Monday.com Settings'}
                    </button>
                  )}

                  {!mondayForm.monday_api_token && !mondayForm.monday_board_id && (
                    <div className="text-center py-6 text-gray-400">
                      <div className="text-3xl mb-2">📋</div>
                      <p className="text-sm">Enter your API token and Board ID above to set up the integration</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
