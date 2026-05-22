import React, { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function ClientRequestForm() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})
  const [attachments, setAttachments] = useState([])
  const [form, setForm] = useState({
    clientName: '', company: '', email: '', phone: '', requestType: '', priority: 'Medium', description: ''
  })

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); if (errors[k]) setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.clientName.trim()) e.clientName = 'Client name is required'
    if (!form.company.trim()) e.company = 'Company name is required'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email is required'
    if (!form.phone.trim()) e.phone = 'Phone is required'
    if (!form.requestType) e.requestType = 'Request type is required'
    if (!form.description.trim()) e.description = 'Description is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('form_type', 'client_request')
      fd.append('submitted_by', user?.username || 'anonymous')
      attachments.forEach(f => fd.append('attachments', f))
      await axios.post('/api/forms/submit', fd)
      toast.success('Request submitted successfully!')
      setSubmitted(true)
    } catch { toast.error('Submission failed. Please try again.') }
    finally { setLoading(false) }
  }

  const priorityColors = { Low: 'bg-gray-100 text-gray-600 border-gray-200', Medium: 'bg-yellow-50 text-yellow-700 border-yellow-200', High: 'bg-red-50 text-red-700 border-red-200' }

  if (submitted) return (
    <div className="card p-10 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
      <p className="text-gray-500 mb-6">We have received your request. Our team will contact you within 1–2 business days.</p>
      <button onClick={() => { setSubmitted(false); setForm({ clientName: '', company: '', email: '', phone: '', requestType: '', priority: 'Medium', description: '' }); setAttachments([]) }} className="btn-primary">Submit Another Request</button>
    </div>
  )

  return (
    <div className="card p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Client Request Form</h1>
        <p className="text-gray-500 text-sm mt-1">Submit a service request, inquiry, or support ticket</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label">Client Name <span className="text-red-500">*</span></label>
            <input value={form.clientName} onChange={e => set('clientName', e.target.value)} className={`input-field ${errors.clientName ? 'input-error' : ''}`} placeholder="Your full name" />
            {errors.clientName && <p className="error-msg">{errors.clientName}</p>}
          </div>
          <div>
            <label className="label">Company <span className="text-red-500">*</span></label>
            <input value={form.company} onChange={e => set('company', e.target.value)} className={`input-field ${errors.company ? 'input-error' : ''}`} placeholder="Company name" />
            {errors.company && <p className="error-msg">{errors.company}</p>}
          </div>
          <div>
            <label className="label">Email <span className="text-red-500">*</span></label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={`input-field ${errors.email ? 'input-error' : ''}`} placeholder="contact@company.com" />
            {errors.email && <p className="error-msg">{errors.email}</p>}
          </div>
          <div>
            <label className="label">Phone <span className="text-red-500">*</span></label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} className={`input-field ${errors.phone ? 'input-error' : ''}`} placeholder="+60 12-345 6789" />
            {errors.phone && <p className="error-msg">{errors.phone}</p>}
          </div>
          <div>
            <label className="label">Request Type <span className="text-red-500">*</span></label>
            <select value={form.requestType} onChange={e => set('requestType', e.target.value)} className={`input-field ${errors.requestType ? 'input-error' : ''}`}>
              <option value="">— Select Type —</option>
              <option>New Service Inquiry</option>
              <option>Technical Support</option>
              <option>Billing Issue</option>
              <option>Account Change</option>
              <option>Complaint</option>
              <option>Other</option>
            </select>
            {errors.requestType && <p className="error-msg">{errors.requestType}</p>}
          </div>
          <div>
            <label className="label">Priority</label>
            <div className="flex gap-2">
              {['Low', 'Medium', 'High'].map(p => (
                <button type="button" key={p} onClick={() => set('priority', p)} className={`flex-1 py-2 text-sm font-medium rounded-lg border transition ${form.priority === p ? priorityColors[p] : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>{p}</button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="label">Description <span className="text-red-500">*</span></label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} className={`input-field resize-none ${errors.description ? 'input-error' : ''}`} rows={4} placeholder="Please describe your request in detail..." />
          {errors.description && <p className="error-msg">{errors.description}</p>}
        </div>

        <div>
          <label className="label">Attachments</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition" onClick={() => document.getElementById('client-files').click()}>
            <input id="client-files" type="file" className="hidden" multiple onChange={e => setAttachments(Array.from(e.target.files))} />
            {attachments.length > 0 ? (
              <div className="space-y-1">
                {attachments.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    {f.name}
                  </div>
                ))}
                <p className="text-xs text-gray-400 mt-2">Click to change files</p>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                <p className="text-sm">Click to attach files (optional)</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={loading} className="btn-primary px-8 flex items-center gap-2">
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</> : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  )
}
