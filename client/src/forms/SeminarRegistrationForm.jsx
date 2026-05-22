import React, { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const seminars = ['Leadership Excellence Workshop', 'Digital Transformation Summit', 'Finance & Compliance Training', 'Customer Service Excellence', 'Data Analytics Bootcamp', 'Safety & Health Awareness']

export default function SeminarRegistrationForm() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', department: '', seminarName: '', date: '', dietaryRequirements: '', specialNeeds: ''
  })

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); if (errors[k]) setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email is required'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    if (!form.department.trim()) e.department = 'Department is required'
    if (!form.seminarName) e.seminarName = 'Please select a seminar'
    if (!form.date) e.date = 'Date is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await axios.post('/api/forms/submit-json', { form_type: 'seminar_registration', data: form, submitted_by: user?.username || 'anonymous' })
      toast.success('Registration submitted successfully!')
      setSubmitted(true)
    } catch { toast.error('Submission failed. Please try again.') }
    finally { setLoading(false) }
  }

  if (submitted) return (
    <div className="card p-10 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
      <p className="text-gray-500 mb-6">Your seminar registration has been submitted. You will receive a confirmation email shortly.</p>
      <button onClick={() => { setSubmitted(false); setForm({ fullName: '', email: '', phone: '', department: '', seminarName: '', date: '', dietaryRequirements: '', specialNeeds: '' }) }} className="btn-primary">Register Again</button>
    </div>
  )

  return (
    <div className="card p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Seminar Registration Form</h1>
        <p className="text-gray-500 text-sm mt-1">Complete the form below to register for a seminar</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label">Full Name <span className="text-red-500">*</span></label>
            <input value={form.fullName} onChange={e => set('fullName', e.target.value)} className={`input-field ${errors.fullName ? 'input-error' : ''}`} placeholder="Enter your full name" />
            {errors.fullName && <p className="error-msg">{errors.fullName}</p>}
          </div>
          <div>
            <label className="label">Email Address <span className="text-red-500">*</span></label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={`input-field ${errors.email ? 'input-error' : ''}`} placeholder="you@company.com" />
            {errors.email && <p className="error-msg">{errors.email}</p>}
          </div>
          <div>
            <label className="label">Phone Number <span className="text-red-500">*</span></label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} className={`input-field ${errors.phone ? 'input-error' : ''}`} placeholder="+60 12-345 6789" />
            {errors.phone && <p className="error-msg">{errors.phone}</p>}
          </div>
          <div>
            <label className="label">Department <span className="text-red-500">*</span></label>
            <input value={form.department} onChange={e => set('department', e.target.value)} className={`input-field ${errors.department ? 'input-error' : ''}`} placeholder="e.g. Human Resources" />
            {errors.department && <p className="error-msg">{errors.department}</p>}
          </div>
          <div>
            <label className="label">Seminar Name <span className="text-red-500">*</span></label>
            <select value={form.seminarName} onChange={e => set('seminarName', e.target.value)} className={`input-field ${errors.seminarName ? 'input-error' : ''}`}>
              <option value="">— Select Seminar —</option>
              {seminars.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.seminarName && <p className="error-msg">{errors.seminarName}</p>}
          </div>
          <div>
            <label className="label">Preferred Date <span className="text-red-500">*</span></label>
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={`input-field ${errors.date ? 'input-error' : ''}`} />
            {errors.date && <p className="error-msg">{errors.date}</p>}
          </div>
          <div>
            <label className="label">Dietary Requirements</label>
            <select value={form.dietaryRequirements} onChange={e => set('dietaryRequirements', e.target.value)} className="input-field">
              <option value="">None</option>
              <option>Halal</option>
              <option>Vegetarian</option>
              <option>Vegan</option>
              <option>Gluten-free</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Special Needs / Accessibility Requirements</label>
          <textarea value={form.specialNeeds} onChange={e => set('specialNeeds', e.target.value)} className="input-field resize-none" rows={3} placeholder="Please describe any special requirements..." />
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={loading} className="btn-primary px-8 flex items-center gap-2">
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</> : 'Submit Registration'}
          </button>
        </div>
      </form>
    </div>
  )
}
