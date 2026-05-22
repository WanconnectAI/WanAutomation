import React, { useState, useRef, useEffect, useCallback } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import SignaturePad from 'signature_pad'

const TOTAL_STEPS = 5
const stepLabels = ['Personal Info', 'Education', 'Employment', 'Emergency', 'Declaration']

function StepIndicator({ current }) {
  return (
    <div className="flex items-center mb-8">
      {stepLabels.map((label, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${done ? 'bg-blue-600 border-blue-600 text-white' : active ? 'bg-white border-blue-600 text-blue-600' : 'bg-white border-gray-300 text-gray-400'}`}>
                {done ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : step}
              </div>
              <span className={`text-xs mt-1.5 font-medium ${active ? 'text-blue-600' : done ? 'text-gray-600' : 'text-gray-400'}`}>{label}</span>
            </div>
            {i < stepLabels.length - 1 && <div className={`flex-1 h-0.5 mx-2 mb-5 ${done ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      {children}
      {error && <p className="error-msg">{error}</p>}
    </div>
  )
}

function DynamicTable({ columns, rows, onChange, minRows = 0 }) {
  const addRow = () => {
    const empty = {}
    columns.forEach(c => { empty[c.key] = '' })
    onChange([...rows, empty])
  }
  const removeRow = (i) => { if (rows.length > minRows) onChange(rows.filter((_, ri) => ri !== i)) }
  const setCell = (i, k, v) => { const r = [...rows]; r[i] = { ...r[i], [k]: v }; onChange(r) }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(c => <th key={c.key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 border-b border-gray-200">{c.label}</th>)}
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 border-b border-gray-200 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {columns.map(c => (
                <td key={c.key} className="px-2 py-1.5">
                  {c.type === 'select' ? (
                    <select value={row[c.key]} onChange={e => setCell(i, c.key, e.target.value)} className="input-field text-xs py-1">
                      <option value="">—</option>
                      {c.options?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={c.type || 'text'} value={row[c.key]} onChange={e => setCell(i, c.key, e.target.value)} className="input-field text-xs py-1" placeholder={c.placeholder || ''} />
                  )}
                </td>
              ))}
              <td className="px-2 py-1.5">
                <button type="button" onClick={() => removeRow(i)} disabled={rows.length <= minRows} className="text-red-400 hover:text-red-600 disabled:opacity-30 p-1 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-2 border-t border-gray-100">
        <button type="button" onClick={addRow} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-xs font-medium transition">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Row
        </button>
      </div>
    </div>
  )
}

const emptyRow = (keys) => { const r = {}; keys.forEach(k => { r[k] = '' }); return r }

export default function JobApplicationForm() {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})
  const sigPadRef = useRef(null)
  const sigCanvasRef = useRef(null)

  // ── Page 1: Personal Info ──
  const [p1, setP1] = useState({
    applyingFor: '', branch: '', nameNRIC: '', email: '', phoneArea: '+60', phoneNumber: '',
    homeAddress: '', sameAsMailing: 'Yes', mailingAddress: '',
    dob: '', maritalStatus: '', religion: '', race: '',
    nric: '', incomeTax: '', epf: '', socso: ''
  })

  // ── Page 2: Education ──
  const familyKeys = ['name', 'age', 'occupation']
  const [familyDetails, setFamilyDetails] = useState([
    { relation: 'Spouse', name: '', age: '', occupation: '' },
    { relation: 'Father', name: '', age: '', occupation: '' },
    { relation: 'Mother', name: '', age: '', occupation: '' },
    { relation: 'Children', name: '', age: '', occupation: '' },
    { relation: 'Siblings', name: '', age: '', occupation: '' },
  ])
  const [p2, setP2] = useState({ highestEducation: '', currentJobDesc: '' })
  const [educationHistory, setEducationHistory] = useState([emptyRow(['institution', 'dateJoined', 'dateGraduated', 'standardPassed'])])
  const [qualifications, setQualifications] = useState([emptyRow(['particulars', 'dateFrom', 'dateTo'])])
  const [memberships, setMemberships] = useState([emptyRow(['bodyName', 'position', 'dateAdmitted'])])
  const [languages] = useState(['Bahasa Melayu', 'English', 'Chinese/Mandarin'])
  const [langProf, setLangProf] = useState({ 'Bahasa Melayu': { oral: '', written: '' }, 'English': { oral: '', written: '' }, 'Chinese/Mandarin': { oral: '', written: '' } })

  // ── Page 3: Employment ──
  const [employmentHistory, setEmploymentHistory] = useState([emptyRow(['dateFrom', 'dateTo', 'employerPosition', 'salary', 'reasons'])])
  const [references, setReferences] = useState([emptyRow(['name', 'jobTitle', 'contactNo', 'email', 'relationship']), emptyRow(['name', 'jobTitle', 'contactNo', 'email', 'relationship'])])
  const [p3, setP3] = useState({ leisureActivities: '', additionalInfo: '' })

  // ── Page 4: Emergency ──
  const [emergencyContacts, setEmergencyContacts] = useState([emptyRow(['name', 'contactNo', 'relationship'])])
  const [otherInfo, setOtherInfo] = useState({ convicted: false, convicted_details: '', dismissed: false, dismissed_details: '', illness: false, illness_details: '' })
  const [p4, setP4] = useState({ startDate: '', expectedSalary: '' })
  const [files, setFiles] = useState({ resume: null, payslip: null, photo: null })

  // ── Page 5: Signature ──
  useEffect(() => {
    if (step === 5 && sigCanvasRef.current && !sigPadRef.current) {
      sigPadRef.current = new SignaturePad(sigCanvasRef.current, { backgroundColor: 'rgba(255,255,255,0)', penColor: '#1e40af' })
    }
  }, [step])

  const validateStep = () => {
    const e = {}
    if (step === 1) {
      if (!p1.applyingFor.trim()) e.applyingFor = 'Required'
      if (!p1.nameNRIC.trim()) e.nameNRIC = 'Required'
      if (!p1.email.trim() || !/\S+@\S+\.\S+/.test(p1.email)) e.email = 'Valid email required'
      if (!p1.phoneNumber.trim()) e.phoneNumber = 'Required'
      if (!p1.homeAddress.trim()) e.homeAddress = 'Required'
      if (!p1.dob) e.dob = 'Required'
      if (!p1.nric.trim()) e.nric = 'Required'
    }
    if (step === 4) {
      if (!p4.startDate) e.startDate = 'Required'
      if (!p4.expectedSalary) e.expectedSalary = 'Required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (validateStep()) {
      setStep(s => s + 1)
      window.scrollTo(0, 0)
    } else {
      toast.error('Please fill in all required fields')
    }
  }
  const back = () => { setStep(s => s - 1); setErrors({}); window.scrollTo(0, 0) }

  const setP1f = (k, v) => { setP1(f => ({ ...f, [k]: v })); if (errors[k]) setErrors(e => ({ ...e, [k]: '' })) }
  const setP4f = (k, v) => { setP4(f => ({ ...f, [k]: v })); if (errors[k]) setErrors(e => ({ ...e, [k]: '' })) }

  const handleSubmit = async () => {
    if (sigPadRef.current?.isEmpty()) { toast.error('Please provide your signature'); return }
    setLoading(true)
    try {
      const signature = sigPadRef.current?.toDataURL() || ''
      const fd = new FormData()
      fd.append('form_type', 'job_application')
      fd.append('submitted_by', user?.username || 'anonymous')
      const payload = { ...p1, ...p2, ...p3, ...p4, familyDetails, educationHistory, qualifications, memberships, langProf, employmentHistory, references, emergencyContacts, otherInfo, signature }
      fd.append('data', JSON.stringify(payload))
      if (files.resume) fd.append('resume', files.resume)
      if (files.payslip) fd.append('payslip', files.payslip)
      if (files.photo) fd.append('photo', files.photo)
      await axios.post('/api/forms/submit', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Application submitted successfully!')
      setSubmitted(true)
    } catch { toast.error('Submission failed. Please try again.') }
    finally { setLoading(false) }
  }

  if (submitted) return (
    <div className="card p-10 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
      <p className="text-gray-500 mb-2">Thank you for your application. Our HR team will be in touch with you shortly.</p>
      <p className="text-sm text-gray-400 mb-6">Please keep an eye on your email for updates.</p>
    </div>
  )

  return (
    <div className="card p-8">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Job Application Form</h1>
        <p className="text-gray-500 text-sm mt-1">Step {step} of {TOTAL_STEPS} — {stepLabels[step - 1]}</p>
      </div>

      <div className="my-6"><StepIndicator current={step} /></div>

      {/* ── STEP 1: Personal Info ── */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Application for Employment As" required error={errors.applyingFor}>
              <input value={p1.applyingFor} onChange={e => setP1f('applyingFor', e.target.value)} className={`input-field ${errors.applyingFor ? 'input-error' : ''}`} placeholder="Position applying for" />
            </Field>
            <Field label="Apply for Branch">
              <select value={p1.branch} onChange={e => setP1f('branch', e.target.value)} className="input-field">
                <option value="">— Please Select —</option>
                {['Kuala Lumpur', 'Selangor', 'Penang', 'Johor Bahru', 'Kota Kinabalu', 'Kuching'].map(b => <option key={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Name as per NRIC" required error={errors.nameNRIC}>
              <input value={p1.nameNRIC} onChange={e => setP1f('nameNRIC', e.target.value)} className={`input-field ${errors.nameNRIC ? 'input-error' : ''}`} placeholder="Full name as per IC" />
            </Field>
            <Field label="Email Address" required error={errors.email}>
              <input type="email" value={p1.email} onChange={e => setP1f('email', e.target.value)} className={`input-field ${errors.email ? 'input-error' : ''}`} placeholder="email@example.com" />
            </Field>
            <Field label="Phone Number" required error={errors.phoneNumber}>
              <div className="flex gap-2">
                <select value={p1.phoneArea} onChange={e => setP1f('phoneArea', e.target.value)} className="input-field w-24">
                  <option>+60</option><option>+65</option><option>+1</option><option>+44</option>
                </select>
                <input value={p1.phoneNumber} onChange={e => setP1f('phoneNumber', e.target.value)} className={`input-field flex-1 ${errors.phoneNumber ? 'input-error' : ''}`} placeholder="12-345 6789" />
              </div>
            </Field>
            <Field label="Date of Birth" required error={errors.dob}>
              <input type="date" value={p1.dob} onChange={e => setP1f('dob', e.target.value)} className={`input-field ${errors.dob ? 'input-error' : ''}`} />
            </Field>
          </div>

          <Field label="Home Address — Street Address" required error={errors.homeAddress}>
            <input value={p1.homeAddress} onChange={e => setP1f('homeAddress', e.target.value)} className={`input-field ${errors.homeAddress ? 'input-error' : ''}`} placeholder="No. 1, Jalan Example, 50000 Kuala Lumpur" />
          </Field>

          <Field label="Same with Home Address?">
            <select value={p1.sameAsMailing} onChange={e => setP1f('sameAsMailing', e.target.value)} className="input-field md:w-40">
              <option>Yes</option><option>No</option>
            </select>
          </Field>

          {p1.sameAsMailing === 'No' && (
            <Field label="Mailing Address — Street Address">
              <input value={p1.mailingAddress} onChange={e => setP1f('mailingAddress', e.target.value)} className="input-field" placeholder="Mailing address" />
            </Field>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Field label="Marital Status">
              <select value={p1.maritalStatus} onChange={e => setP1f('maritalStatus', e.target.value)} className="input-field">
                <option value="">— Select —</option>
                {['Single', 'Married', 'Divorced', 'Widowed'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Religion">
              <select value={p1.religion} onChange={e => setP1f('religion', e.target.value)} className="input-field">
                <option value="">— Select —</option>
                {['Islam', 'Christianity', 'Buddhism', 'Hinduism', 'Taoism', 'Other'].map(r => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Race">
              <select value={p1.race} onChange={e => setP1f('race', e.target.value)} className="input-field">
                <option value="">— Select —</option>
                {['Malay', 'Chinese', 'Indian', 'Iban', 'Kadazan', 'Other Bumiputera', 'Other'].map(r => <option key={r}>{r}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="NRIC Number" required error={errors.nric}>
              <input value={p1.nric} onChange={e => setP1f('nric', e.target.value)} className={`input-field ${errors.nric ? 'input-error' : ''}`} placeholder="XXXXXX-XX-XXXX" />
            </Field>
            <Field label="Income Tax Number">
              <input value={p1.incomeTax} onChange={e => setP1f('incomeTax', e.target.value)} className="input-field" placeholder="SG XXXXXXXX" />
            </Field>
            <Field label="EPF Number">
              <input value={p1.epf} onChange={e => setP1f('epf', e.target.value)} className="input-field" placeholder="XXXX XXXXXXXX X" />
            </Field>
            <Field label="SOCSO Number">
              <input value={p1.socso} onChange={e => setP1f('socso', e.target.value)} className="input-field" placeholder="SOCSO number" />
            </Field>
          </div>
        </div>
      )}

      {/* ── STEP 2: Education & Background ── */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Family Details</h3>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 border-b">Relation</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 border-b">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 border-b">Age</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 border-b">Occupation</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {familyDetails.map((row, i) => (
                    <tr key={i}><td className="px-3 py-2 text-gray-600 font-medium text-xs">{row.relation}</td>
                      {['name', 'age', 'occupation'].map(k => (
                        <td key={k} className="px-2 py-1.5"><input value={row[k]} onChange={e => { const r = [...familyDetails]; r[i] = { ...r[i], [k]: e.target.value }; setFamilyDetails(r) }} className="input-field text-xs py-1" /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Field label="Your Highest Education">
            <input value={p2.highestEducation} onChange={e => setP2(f => ({ ...f, highestEducation: e.target.value }))} className="input-field" placeholder="e.g. Bachelor's Degree in Computer Science" />
          </Field>

          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Education History</h3>
            <DynamicTable rows={educationHistory} onChange={setEducationHistory}
              columns={[{ key: 'institution', label: 'School / College / University' }, { key: 'dateJoined', label: 'Date Joined', type: 'date' }, { key: 'dateGraduated', label: 'Date Graduated', type: 'date' }, { key: 'standardPassed', label: 'Highest Standard Passed' }]} />
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Other Academic or Professional Qualifications</h3>
            <DynamicTable rows={qualifications} onChange={setQualifications}
              columns={[{ key: 'particulars', label: 'Particulars' }, { key: 'dateFrom', label: 'Date From', type: 'date' }, { key: 'dateTo', label: 'Date To', type: 'date' }]} />
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Professional Memberships</h3>
            <DynamicTable rows={memberships} onChange={setMemberships}
              columns={[{ key: 'bodyName', label: 'Name of Professional Body' }, { key: 'position', label: 'Membership Position' }, { key: 'dateAdmitted', label: 'Date Admitted', type: 'date' }]} />
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Language Proficiency</h3>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 border-b">Language</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 border-b">Oral</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 border-b">Written</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {languages.map(lang => (
                    <tr key={lang}><td className="px-3 py-2 text-xs font-medium text-gray-600">{lang}</td>
                      {['oral', 'written'].map(type => (
                        <td key={type} className="px-2 py-1.5"><select value={langProf[lang][type]} onChange={e => setLangProf(p => ({ ...p, [lang]: { ...p[lang], [type]: e.target.value } }))} className="input-field text-xs py-1">
                          <option value="">—</option>{['Poor', 'Fair', 'Good', 'Excellent'].map(o => <option key={o}>{o}</option>)}
                        </select></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Employment & References ── */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Employment History</h3>
            <DynamicTable rows={employmentHistory} onChange={setEmploymentHistory}
              columns={[{ key: 'dateFrom', label: 'Date From', type: 'date' }, { key: 'dateTo', label: 'Date To', type: 'date' }, { key: 'employerPosition', label: 'Employer & Position' }, { key: 'salary', label: 'Last Drawn Salary' }, { key: 'reasons', label: 'Reasons for Leaving' }]} />
          </div>

          <Field label="Brief Description of Current / Most Recent Role & Responsibilities">
            <textarea value={p2.currentJobDesc} onChange={e => setP2(f => ({ ...f, currentJobDesc: e.target.value }))} className="input-field resize-none" rows={4} placeholder="Describe your current or most recent job role and responsibilities..." />
          </Field>

          <div>
            <h3 className="font-semibold text-gray-700 mb-1">Reference Details <span className="text-xs text-gray-400 font-normal">(minimum 2)</span></h3>
            <DynamicTable rows={references} onChange={setReferences} minRows={2}
              columns={[{ key: 'name', label: 'Name' }, { key: 'jobTitle', label: 'Job Title & Employer' }, { key: 'contactNo', label: 'Contact No' }, { key: 'email', label: 'Email' }, { key: 'relationship', label: 'Relationship' }]} />
          </div>

          <Field label="Leisure Activities">
            <textarea value={p3.leisureActivities} onChange={e => setP3(f => ({ ...f, leisureActivities: e.target.value }))} className="input-field resize-none" rows={3} placeholder="e.g. Reading, hiking, photography..." />
          </Field>

          <Field label="Additional Information">
            <textarea value={p3.additionalInfo} onChange={e => setP3(f => ({ ...f, additionalInfo: e.target.value }))} className="input-field resize-none" rows={3} placeholder="Any other relevant information you'd like to share..." />
          </Field>
        </div>
      )}

      {/* ── STEP 4: Emergency & Documents ── */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Emergency Contact</h3>
            <DynamicTable rows={emergencyContacts} onChange={setEmergencyContacts}
              columns={[{ key: 'name', label: 'Name' }, { key: 'contactNo', label: 'Contact No' }, { key: 'relationship', label: 'Relationship' }]} />
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Other Information <span className="text-xs text-gray-400 font-normal">(Check if Yes)</span></h3>
            <div className="space-y-4">
              {[
                { key: 'convicted', label: 'Have you at any time been convicted or found guilty of any serious offence by any court?', detailKey: 'convicted_details' },
                { key: 'dismissed', label: 'Have you ever been dismissed from any employment?', detailKey: 'dismissed_details' },
                { key: 'illness', label: 'Do you have any serious illness?', detailKey: 'illness_details' },
              ].map(item => (
                <div key={item.key} className="p-4 border border-gray-200 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={otherInfo[item.key]} onChange={e => setOtherInfo(p => ({ ...p, [item.key]: e.target.checked }))} className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300" />
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </label>
                  {otherInfo[item.key] && (
                    <div className="mt-3 ml-7">
                      <input value={otherInfo[item.detailKey]} onChange={e => setOtherInfo(p => ({ ...p, [item.detailKey]: e.target.value }))} className="input-field text-sm" placeholder="Please provide details..." />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Available Start Date" required error={errors.startDate}>
              <input type="date" value={p4.startDate} onChange={e => setP4f('startDate', e.target.value)} className={`input-field ${errors.startDate ? 'input-error' : ''}`} />
            </Field>
            <Field label="Expected Salary (RM)" required error={errors.expectedSalary}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">RM</span>
                <input type="number" min="0" value={p4.expectedSalary} onChange={e => setP4f('expectedSalary', e.target.value)} className={`input-field pl-10 ${errors.expectedSalary ? 'input-error' : ''}`} placeholder="0" />
              </div>
            </Field>
          </div>

          <div className="space-y-4">
            {[
              { key: 'resume', label: 'Resume, Academic Results & Professional Certificates', multiple: true, accept: '.pdf,.doc,.docx,image/*' },
              { key: 'payslip', label: 'Last Drawn Payslip', multiple: false, accept: '.pdf,image/*' },
              { key: 'photo', label: 'Recent Photo', multiple: false, accept: 'image/*' },
            ].map(f => (
              <div key={f.key}>
                <label className="label">{f.label}</label>
                <div className={`border-2 border-dashed rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition ${files[f.key] ? 'border-green-400 bg-green-50' : 'border-gray-300'}`} onClick={() => document.getElementById(`file-${f.key}`).click()}>
                  <input id={`file-${f.key}`} type="file" className="hidden" accept={f.accept} onChange={e => setFiles(p => ({ ...p, [f.key]: e.target.files[0] }))} />
                  {files[f.key] ? (
                    <div className="flex items-center gap-2 text-green-700 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {files[f.key].name}
                      <button type="button" onClick={e => { e.stopPropagation(); setFiles(p => ({ ...p, [f.key]: null })) }} className="ml-auto text-red-500 hover:text-red-700 text-xs">✕</button>
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 text-sm">Click to upload {f.label.toLowerCase()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 5: Declaration & Signature ── */}
      {step === 5 && (
        <div className="space-y-6">
          <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl">
            <h3 className="font-semibold text-blue-900 mb-2">Declaration</h3>
            <p className="text-sm text-blue-800 leading-relaxed">
              I hereby confirm that the information stated above is true and accurate. I understand that false information may be grounds for not hiring me or for immediate termination of employment at any point in the future if I am hired. I authorize the company to verify any information provided in this application and to conduct reference checks as necessary.
            </p>
          </div>

          <div>
            <label className="label">Signature <span className="text-red-500">*</span></label>
            <p className="text-xs text-gray-400 mb-2">Please sign below using your mouse or touch</p>
            <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white">
              <canvas ref={sigCanvasRef} className="w-full touch-none" width={700} height={200} style={{ display: 'block' }} />
            </div>
            <button type="button" onClick={() => sigPadRef.current?.clear()} className="mt-2 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Clear Signature
            </button>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            By clicking <strong>Submit Application</strong>, you confirm that you have read and agreed to the declaration above.
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
        <button type="button" onClick={back} disabled={step === 1} className="btn-secondary flex items-center gap-2 disabled:opacity-40">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
        <span className="text-sm text-gray-400">{step} / {TOTAL_STEPS}</span>
        {step < TOTAL_STEPS ? (
          <button type="button" onClick={next} className="btn-primary flex items-center gap-2">
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={loading} className="btn-primary flex items-center gap-2 px-6">
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</> : <>Submit Application<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></>}
          </button>
        )}
      </div>
    </div>
  )
}
