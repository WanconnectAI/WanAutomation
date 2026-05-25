import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const BASE_FORMS = [
  { type: 'job_application', name: 'Job Application Form' },
  { type: 'seminar_registration', name: 'Seminar Registration Form' },
  { type: 'staff_claim', name: 'Staff Claim Form' },
  { type: 'client_request', name: 'Client Request Form' },
]

const FIELD_HINTS = {
  job_application: ['nameNRIC', 'email', 'applyingFor', 'branch', 'submission_id'],
  seminar_registration: ['fullName', 'email', 'seminarName', 'submission_id'],
  staff_claim: ['staffName', 'email', 'claimType', 'totalAmount', 'submission_id'],
  client_request: ['clientName', 'email', 'requestType', 'submission_id'],
}

const DEFAULT_RULE = {
  name: '',
  form_type: 'job_application',
  trigger: 'on_submit',
  action_type: 'email',
  action_config: {
    to: '',
    subject: 'New {{form_type}} submission #{{submission_id}}',
    body: 'A new form submission has been received.\n\nSubmission ID: #{{submission_id}}\n\nPlease login to the portal to review the full details.',
  },
  is_active: true,
}

function RuleModal({ rule, allForms, onClose, onSave }) {
  const [form, setForm] = useState(() => rule
    ? { ...rule, action_config: { ...rule.action_config } }
    : { ...DEFAULT_RULE, action_config: { ...DEFAULT_RULE.action_config } }
  )
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setCfg = (k, v) => setForm(f => ({ ...f, action_config: { ...f.action_config, [k]: v } }))

  const hints = FIELD_HINTS[form.form_type] || ['submission_id']

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Rule name is required'); return }
    if (!form.action_config.to?.trim()) { toast.error('At least one recipient email is required'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        action_config: {
          ...form.action_config,
          to: form.action_config.to.split(',').map(e => e.trim()).filter(Boolean),
        }
      }
      await onSave(payload)
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
          <h3 className="font-semibold text-gray-900">{rule ? 'Edit Automation Rule' : 'Create Automation Rule'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Rule name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name <span className="text-red-500">*</span></label>
            <input className="input" placeholder="e.g. Notify HR on Job Application" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>

          {/* Trigger */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Form</label>
              <select className="input" value={form.form_type} onChange={e => set('form_type', e.target.value)}>
                {allForms.map(f => <option key={f.type} value={f.type}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">When</label>
              <select className="input" value={form.trigger} onChange={e => set('trigger', e.target.value)}>
                <option value="on_submit">Form is submitted</option>
              </select>
            </div>
          </div>

          {/* Action */}
          <div className="border border-blue-100 bg-blue-50/50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Send Email
            </p>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To (comma-separated emails) <span className="text-red-500">*</span></label>
              <input className="input text-sm" placeholder="hr@company.com, manager@company.com"
                value={Array.isArray(form.action_config.to) ? form.action_config.to.join(', ') : form.action_config.to}
                onChange={e => setCfg('to', e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
              <input className="input text-sm" placeholder="New submission #{{submission_id}}"
                value={form.action_config.subject} onChange={e => setCfg('subject', e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email Body</label>
              <textarea rows={5} className="input text-sm resize-none font-mono"
                value={form.action_config.body} onChange={e => setCfg('body', e.target.value)} />
            </div>

            <div className="bg-white border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-600 mb-1.5">Available placeholders for this form:</p>
              <div className="flex flex-wrap gap-1.5">
                {hints.map(h => (
                  <button key={h} type="button"
                    onClick={() => setCfg('body', form.action_config.body + `{{${h}}}`)}
                    className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200 transition">
                    {`{{${h}}}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={form.is_active}
              onChange={e => set('is_active', e.target.checked)} className="rounded" />
            <label htmlFor="is_active" className="text-sm text-gray-700">Active (rule will fire on submissions)</label>
          </div>
        </div>

        <div className="p-4 border-t flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm">
            {saving ? 'Saving…' : rule ? 'Update Rule' : 'Create Rule'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SmtpSettings() {
  const [settings, setSettings] = useState({ smtp_host: '', smtp_port: '587', smtp_user: '', smtp_pass: '', smtp_from: '', smtp_secure: 'false' })
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    axios.get('/api/automations/settings')
      .then(r => { setSettings(s => ({ ...s, ...r.data })); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await axios.post('/api/automations/settings', settings)
      toast.success('SMTP settings saved')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const testConnection = async () => {
    setTesting(true)
    try {
      await axios.post('/api/automations/test-smtp')
      toast.success('SMTP connection successful!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Connection failed')
    } finally { setTesting(false) }
  }

  if (!loaded) return <div className="card p-6 animate-pulse h-48" />

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">SMTP Email Settings</h3>
          <p className="text-xs text-gray-500 mt-0.5">Configure outgoing email for automation notifications</p>
        </div>
        <button onClick={testConnection} disabled={testing}
          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {testing ? 'Testing…' : 'Test Connection'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">SMTP Host</label>
          <input className="input text-sm" placeholder="smtp.gmail.com" value={settings.smtp_host}
            onChange={e => setSettings(s => ({ ...s, smtp_host: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Port</label>
          <input className="input text-sm" placeholder="587" value={settings.smtp_port}
            onChange={e => setSettings(s => ({ ...s, smtp_port: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Username / Email</label>
          <input className="input text-sm" placeholder="you@gmail.com" value={settings.smtp_user}
            onChange={e => setSettings(s => ({ ...s, smtp_user: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Password / App Password</label>
          <input type="password" className="input text-sm" placeholder="••••••••" value={settings.smtp_pass}
            onChange={e => setSettings(s => ({ ...s, smtp_pass: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">From Address</label>
          <input className="input text-sm" placeholder="portal@yourcompany.com" value={settings.smtp_from}
            onChange={e => setSettings(s => ({ ...s, smtp_from: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Encryption</label>
          <select className="input text-sm" value={settings.smtp_secure}
            onChange={e => setSettings(s => ({ ...s, smtp_secure: e.target.value }))}>
            <option value="false">STARTTLS (port 587)</option>
            <option value="true">SSL/TLS (port 465)</option>
          </select>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
        <strong>Gmail tip:</strong> Use an <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" className="underline">App Password</a> (not your regular password). Enable 2FA first, then generate the app password.
      </div>

      <button onClick={save} disabled={saving} className="btn-primary text-sm w-full py-2">
        {saving ? 'Saving…' : 'Save SMTP Settings'}
      </button>
    </div>
  )
}

export default function Automations() {
  const [rules, setRules] = useState([])
  const [customForms, setCustomForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'new' | rule object

  const allForms = [
    ...BASE_FORMS,
    ...customForms.map(cf => ({ type: `custom_${cf.id}`, name: cf.name }))
  ]

  const load = async () => {
    setLoading(true)
    try {
      const [rulesRes, cfRes] = await Promise.all([
        axios.get('/api/automations'),
        axios.get('/api/custom-forms').catch(() => ({ data: [] }))
      ])
      setRules(rulesRes.data)
      setCustomForms(cfRes.data || [])
    } catch { toast.error('Failed to load automations') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const saveRule = async (payload) => {
    try {
      if (payload.id) {
        await axios.put(`/api/automations/${payload.id}`, payload)
        toast.success('Rule updated')
      } else {
        await axios.post('/api/automations', payload)
        toast.success('Rule created')
      }
      setModal(null)
      load()
    } catch { toast.error('Failed to save rule') }
  }

  const toggleRule = async (id) => {
    try {
      await axios.patch(`/api/automations/${id}/toggle`)
      load()
    } catch { toast.error('Failed to toggle rule') }
  }

  const deleteRule = async (id) => {
    if (!confirm('Delete this automation rule?')) return
    try {
      await axios.delete(`/api/automations/${id}`)
      toast.success('Rule deleted')
      load()
    } catch { toast.error('Failed to delete rule') }
  }

  const formName = (type) => allForms.find(f => f.type === type)?.name || type

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automation Flows</h1>
          <p className="text-gray-500 text-sm mt-1">Define actions that trigger automatically when forms are submitted</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Rule
        </button>
      </div>

      {/* SMTP Config */}
      <SmtpSettings />

      {/* Rules list */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Automation Rules</h2>
        {loading ? (
          <div className="card p-8 text-center"><div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : rules.length === 0 ? (
          <div className="card p-12 text-center border-2 border-dashed border-gray-200">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-gray-500 font-medium">No automation rules yet</p>
            <p className="text-gray-400 text-sm mt-1">Create a rule to send email notifications when forms are submitted</p>
            <button onClick={() => setModal('new')} className="btn-primary text-sm mt-4 px-5">Create First Rule</button>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map(rule => (
              <div key={rule.id} className={`card p-4 border transition-all ${rule.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${rule.is_active ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <svg className={`w-4 h-4 ${rule.is_active ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{rule.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        When <span className="font-medium text-gray-700">{formName(rule.form_type)}</span> is submitted
                        → Email <span className="font-medium text-gray-700">
                          {Array.isArray(rule.action_config?.to) ? rule.action_config.to.join(', ') : rule.action_config?.to}
                        </span>
                      </p>
                      {rule.action_config?.subject && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">Subject: {rule.action_config.subject}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleRule(rule.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${rule.is_active ? 'bg-blue-600' : 'bg-gray-200'}`}>
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${rule.is_active ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                    </button>
                    <button onClick={() => setModal(rule)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => deleteRule(rule.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <RuleModal
          rule={modal === 'new' ? null : modal}
          allForms={allForms}
          onClose={() => setModal(null)}
          onSave={saveRule}
        />
      )}
    </div>
  )
}
