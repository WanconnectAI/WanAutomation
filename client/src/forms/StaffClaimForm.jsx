import React, { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function StaffClaimForm() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})
  const [receipt, setReceipt] = useState(null)
  const [form, setForm] = useState({
    staffName: user?.username || '', staffId: '', department: '', claimType: '', amount: '', receiptDate: '', description: ''
  })

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); if (errors[k]) setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.staffName.trim()) e.staffName = 'Staff name is required'
    if (!form.staffId.trim()) e.staffId = 'Staff ID is required'
    if (!form.department.trim()) e.department = 'Department is required'
    if (!form.claimType) e.claimType = 'Claim type is required'
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) e.amount = 'Valid amount is required'
    if (!form.receiptDate) e.receiptDate = 'Receipt date is required'
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
      fd.append('form_type', 'staff_claim')
      fd.append('submitted_by', user?.username || 'anonymous')
      if (receipt) fd.append('receipt', receipt)
      await axios.post('/api/forms/submit', fd)
      toast.success('Claim submitted successfully!')
      setSubmitted(true)
    } catch { toast.error('Submission failed. Please try again.') }
    finally { setLoading(false) }
  }

  if (submitted) return (
    <div className="card p-10 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Claim Submitted!</h2>
      <p className="text-gray-500 mb-6">Your expense claim has been received and will be processed within 3–5 business days.</p>
      <button onClick={() => { setSubmitted(false); setForm({ staffName: user?.username || '', staffId: '', department: '', claimType: '', amount: '', receiptDate: '', description: '' }); setReceipt(null) }} className="btn-primary">Submit Another Claim</button>
    </div>
  )

  return (
    <div className="card p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Staff Claim Form</h1>
        <p className="text-gray-500 text-sm mt-1">Submit your expense claim for reimbursement</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label">Staff Name <span className="text-red-500">*</span></label>
            <input value={form.staffName} onChange={e => set('staffName', e.target.value)} className={`input-field ${errors.staffName ? 'input-error' : ''}`} />
            {errors.staffName && <p className="error-msg">{errors.staffName}</p>}
          </div>
          <div>
            <label className="label">Staff ID <span className="text-red-500">*</span></label>
            <input value={form.staffId} onChange={e => set('staffId', e.target.value)} className={`input-field ${errors.staffId ? 'input-error' : ''}`} placeholder="e.g. EMP-001" />
            {errors.staffId && <p className="error-msg">{errors.staffId}</p>}
          </div>
          <div>
            <label className="label">Department <span className="text-red-500">*</span></label>
            <input value={form.department} onChange={e => set('department', e.target.value)} className={`input-field ${errors.department ? 'input-error' : ''}`} placeholder="e.g. Finance" />
            {errors.department && <p className="error-msg">{errors.department}</p>}
          </div>
          <div>
            <label className="label">Claim Type <span className="text-red-500">*</span></label>
            <select value={form.claimType} onChange={e => set('claimType', e.target.value)} className={`input-field ${errors.claimType ? 'input-error' : ''}`}>
              <option value="">— Select Type —</option>
              <option>Medical</option>
              <option>Travel</option>
              <option>Meal</option>
              <option>Other</option>
            </select>
            {errors.claimType && <p className="error-msg">{errors.claimType}</p>}
          </div>
          <div>
            <label className="label">Amount (RM) <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">RM</span>
              <input type="number" step="0.01" min="0" value={form.amount} onChange={e => set('amount', e.target.value)} className={`input-field pl-10 ${errors.amount ? 'input-error' : ''}`} placeholder="0.00" />
            </div>
            {errors.amount && <p className="error-msg">{errors.amount}</p>}
          </div>
          <div>
            <label className="label">Receipt Date <span className="text-red-500">*</span></label>
            <input type="date" value={form.receiptDate} onChange={e => set('receiptDate', e.target.value)} className={`input-field ${errors.receiptDate ? 'input-error' : ''}`} />
            {errors.receiptDate && <p className="error-msg">{errors.receiptDate}</p>}
          </div>
        </div>

        <div>
          <label className="label">Description <span className="text-red-500">*</span></label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} className={`input-field resize-none ${errors.description ? 'input-error' : ''}`} rows={3} placeholder="Briefly describe the expense..." />
          {errors.description && <p className="error-msg">{errors.description}</p>}
        </div>

        <div>
          <label className="label">Receipt Upload</label>
          <div className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition ${receipt ? 'border-green-400 bg-green-50' : 'border-gray-300'}`} onClick={() => document.getElementById('receipt-file').click()}>
            <input id="receipt-file" type="file" className="hidden" accept="image/*,.pdf" onChange={e => setReceipt(e.target.files[0])} />
            {receipt ? (
              <div className="flex items-center justify-center gap-2 text-green-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-sm font-medium">{receipt.name}</span>
                <button type="button" onClick={e => { e.stopPropagation(); setReceipt(null) }} className="ml-2 text-red-500 hover:text-red-700 text-xs">✕</button>
              </div>
            ) : (
              <div className="text-gray-500">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                <p className="text-sm">Click to upload receipt (PDF or image, max 10MB)</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={loading} className="btn-primary px-8 flex items-center gap-2">
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</> : 'Submit Claim'}
          </button>
        </div>
      </form>
    </div>
  )
}
