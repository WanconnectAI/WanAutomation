import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import SubmissionsTable from '../components/SubmissionsTable'
import FormSettingsModal from '../components/FormSettingsModal'

const BASE_FORM_FIELDS = {
  job_application: {
    pages: [
      { id: 'p1', title: 'Personal Information', fields: [
        { id: 'f1', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter your full name' },
        { id: 'f2', label: 'Email Address', type: 'email', required: true, placeholder: 'email@example.com' },
        { id: 'f3', label: 'Phone Number', type: 'tel', required: true, placeholder: '+60 12-345 6789' },
        { id: 'f4', label: 'NRIC / Passport No.', type: 'text', required: true, placeholder: 'e.g. 900101-01-1234' },
        { id: 'f5', label: 'Date of Birth', type: 'date', required: true },
        { id: 'f6', label: 'Nationality', type: 'text', required: true, placeholder: 'e.g. Malaysian' },
        { id: 'f7', label: 'Current Address', type: 'textarea', required: true, placeholder: 'Full address' },
      ]},
      { id: 'p2', title: 'Education', fields: [
        { id: 'f8', label: 'Highest Qualification', type: 'select', required: true, options: ['SPM','STPM','Diploma','Bachelor\'s Degree','Master\'s Degree','PhD','Others'] },
        { id: 'f9', label: 'Field of Study', type: 'text', required: true, placeholder: 'e.g. Business Administration' },
        { id: 'f10', label: 'Institution Name', type: 'text', required: true, placeholder: 'University / College name' },
        { id: 'f11', label: 'Graduation Year', type: 'text', required: true, placeholder: 'e.g. 2020' },
        { id: 'f12', label: 'CGPA / Grade', type: 'text', placeholder: 'e.g. 3.50' },
      ]},
      { id: 'p3', title: 'Work Experience', fields: [
        { id: 'f13', label: 'Years of Experience', type: 'select', required: true, options: ['Fresh Graduate','Less than 1 year','1-2 years','3-5 years','5-10 years','More than 10 years'] },
        { id: 'f14', label: 'Current / Last Employer', type: 'text', placeholder: 'Company name' },
        { id: 'f15', label: 'Current / Last Position', type: 'text', placeholder: 'Job title' },
        { id: 'f16', label: 'Key Skills', type: 'textarea', placeholder: 'List your key skills and competencies' },
      ]},
      { id: 'p4', title: 'References', fields: [
        { id: 'f17', label: 'Reference Name', type: 'text', placeholder: 'Full name of reference' },
        { id: 'f18', label: 'Reference Position', type: 'text', placeholder: 'Job title' },
        { id: 'f19', label: 'Reference Contact', type: 'tel', placeholder: 'Phone or email' },
        { id: 'f20', label: 'Relationship', type: 'text', placeholder: 'e.g. Former Supervisor' },
      ]},
      { id: 'p5', title: 'Declaration', fields: [
        { id: 'f21', label: 'Position Applied For', type: 'text', required: true, placeholder: 'Job position' },
        { id: 'f22', label: 'Expected Salary (RM)', type: 'text', placeholder: 'e.g. 3500' },
        { id: 'f23', label: 'Available Start Date', type: 'date' },
        { id: 'f24', label: 'Digital Signature (Full Name)', type: 'text', required: true, placeholder: 'Type your full name as signature' },
        { id: 'f25', label: 'Declaration Date', type: 'date', required: true },
      ]},
    ]
  },
  seminar_registration: {
    pages: [
      { id: 'p1', title: 'Registration Details', fields: [
        { id: 'f1', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter your full name' },
        { id: 'f2', label: 'Email Address', type: 'email', required: true, placeholder: 'email@example.com' },
        { id: 'f3', label: 'Phone Number', type: 'tel', required: true, placeholder: '+60 12-345 6789' },
        { id: 'f4', label: 'Company / Organisation', type: 'text', placeholder: 'Your company name' },
        { id: 'f5', label: 'Job Title', type: 'text', placeholder: 'Your position' },
        { id: 'f6', label: 'Seminar / Event Name', type: 'text', required: true, placeholder: 'Name of seminar' },
        { id: 'f7', label: 'Seminar Date', type: 'date', required: true },
        { id: 'f8', label: 'Dietary Requirement', type: 'select', options: ['None','Halal','Vegetarian','Vegan','Others'] },
        { id: 'f9', label: 'Special / Accessibility Needs', type: 'textarea', placeholder: 'Any special requirements' },
      ]}
    ]
  },
  staff_claim: {
    pages: [
      { id: 'p1', title: 'Claim Details', fields: [
        { id: 'f1', label: 'Staff Name', type: 'text', required: true, placeholder: 'Your full name' },
        { id: 'f2', label: 'Staff ID', type: 'text', required: true, placeholder: 'e.g. WC-001' },
        { id: 'f3', label: 'Department', type: 'text', required: true, placeholder: 'Your department' },
        { id: 'f4', label: 'Claim Date', type: 'date', required: true },
        { id: 'f5', label: 'Claim Type', type: 'select', required: true, options: ['Medical','Travel','Meal Allowance','Accommodation','Parking','Telecommunication','Others'] },
        { id: 'f6', label: 'Claim Amount (RM)', type: 'number', required: true, placeholder: '0.00' },
        { id: 'f7', label: 'Description / Remarks', type: 'textarea', required: true, placeholder: 'Describe the expense' },
        { id: 'f8', label: 'Receipt / Supporting Document', type: 'file' },
        { id: 'f9', label: 'Supervisor / Approver Name', type: 'text', placeholder: 'Name of approving manager' },
      ]}
    ]
  },
  client_request: {
    pages: [
      { id: 'p1', title: 'Request Information', fields: [
        { id: 'f1', label: 'Client Name', type: 'text', required: true, placeholder: 'Your full name' },
        { id: 'f2', label: 'Company Name', type: 'text', placeholder: 'Your company' },
        { id: 'f3', label: 'Email Address', type: 'email', required: true, placeholder: 'email@example.com' },
        { id: 'f4', label: 'Phone Number', type: 'tel', placeholder: '+60 12-345 6789' },
        { id: 'f5', label: 'Request Type', type: 'select', required: true, options: ['Service Request','Project Inquiry','Support Ticket','General Inquiry','Complaint','Others'] },
        { id: 'f6', label: 'Subject', type: 'text', required: true, placeholder: 'Brief subject of your request' },
        { id: 'f7', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe your request in detail' },
        { id: 'f8', label: 'Priority', type: 'select', options: ['Low','Medium','High','Urgent'] },
        { id: 'f9', label: 'Attachment', type: 'file' },
      ]}
    ]
  }
}

const BASE_FORMS = [
  { type: 'job_application', name: 'Job Application Form', description: 'Multi-step employment application with personal info, education, employment history, references, and digital signature.', department: 'HR', color: 'purple', icon: '📋', pages: 5 },
  { type: 'seminar_registration', name: 'Seminar Registration Form', description: 'Quick registration for company seminars and training events with dietary and accessibility requirements.', department: 'Training', color: 'green', icon: '🎓', pages: 1 },
  { type: 'staff_claim', name: 'Staff Claim Form', description: 'Submit expense claims for medical, travel, meals, and other work-related expenses with receipt upload.', department: 'Finance', color: 'orange', icon: '💰', pages: 1 },
  { type: 'client_request', name: 'Client Request Form', description: 'Submit service requests, project inquiries, or support tickets from external clients with priority assignment.', department: 'Operations', color: 'blue', icon: '📝', pages: 1 },
]

const colorMap = {
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', btn: 'border-purple-200 text-purple-700 hover:bg-purple-50' },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700',   btn: 'border-green-200 text-green-700 hover:bg-green-50' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', btn: 'border-orange-200 text-orange-700 hover:bg-orange-50' },
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700',     btn: 'border-blue-200 text-blue-700 hover:bg-blue-50' },
  red:    { bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700',       btn: 'border-red-200 text-red-700 hover:bg-red-50' },
  pink:   { bg: 'bg-pink-50',   border: 'border-pink-200',   badge: 'bg-pink-100 text-pink-700',     btn: 'border-pink-200 text-pink-700 hover:bg-pink-50' },
}

function getC(color) { return colorMap[color] || colorMap.blue }

export default function FormsAndTables() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [viewingSubmissions, setViewingSubmissions] = useState(null)
  const [settingsForm, setSettingsForm] = useState(null)
  const [formSettings, setFormSettings] = useState({})
  const [customForms, setCustomForms] = useState([])
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [viewMode, setViewMode] = useState('list') // 'card' | 'list'
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name')   // 'name' | 'department' | 'status'
  const [sortDir, setSortDir] = useState('asc')

  const allForms = [
    ...BASE_FORMS,
    ...customForms.map(cf => ({
      type: `custom_${cf.id}`,
      name: cf.name,
      description: cf.description,
      department: cf.department,
      color: cf.color,
      icon: cf.icon,
      isCustom: true,
      customId: cf.id,
      fieldCount: cf.fields?.length || 0,
    }))
  ]

  const filteredForms = useMemo(() => {
    let list = [...allForms]
    // ── Search ──────────────────────────────────────
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(f =>
        f.name.toLowerCase().includes(q) ||
        (f.department || '').toLowerCase().includes(q)
      )
    }
    // ── Sort ────────────────────────────────────────
    list.sort((a, b) => {
      if (sortBy === 'status') {
        const av = formSettings[a.type]?.is_published ? 1 : 0
        const bv = formSettings[b.type]?.is_published ? 1 : 0
        return sortDir === 'asc' ? av - bv : bv - av
      }
      const av = sortBy === 'department' ? (a.department || '') : a.name
      const bv = sortBy === 'department' ? (b.department || '') : b.name
      const cmp = av.localeCompare(bv)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [allForms, searchQuery, sortBy, sortDir, formSettings])

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  const SortIcon = ({ col }) => (
    <svg className={`w-3 h-3 inline ml-1 transition-transform ${sortBy === col ? 'text-blue-600' : 'text-gray-300'} ${sortBy === col && sortDir === 'desc' ? 'rotate-180' : ''}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
    </svg>
  )

  const loadAllSettings = async () => {
    try {
      const [settingsResults, customRes] = await Promise.all([
        Promise.all(
          BASE_FORMS.map(f =>
            axios.get(`/api/form-settings/${f.type}`)
              .then(r => ({ type: f.type, data: r.data }))
              .catch(() => null)
          )
        ),
        axios.get('/api/custom-forms').catch(() => ({ data: [] }))
      ])
      const map = {}
      settingsResults.forEach(r => { if (r) map[r.type] = r.data })

      const cf = customRes.data || []
      const customSettingsResults = await Promise.all(
        cf.map(f =>
          axios.get(`/api/form-settings/custom_${f.id}`)
            .then(r => ({ type: `custom_${f.id}`, data: r.data }))
            .catch(() => null)
        )
      )
      customSettingsResults.forEach(r => { if (r) map[r.type] = r.data })

      setCustomForms(cf)
      setFormSettings(map)
    } catch {}
    finally { setLoadingSettings(false) }
  }

  useEffect(() => { if (user) loadAllSettings() }, [user])

  const copyPublicLink = (token, e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(`${window.location.origin}/f/${token}`)
      .then(() => toast.success('Public link copied!'))
  }

  const duplicateCustomForm = async (customId, e) => {
    e.stopPropagation()
    try {
      await axios.post(`/api/custom-forms/${customId}/duplicate`)
      toast.success('Form duplicated')
      loadAllSettings()
    } catch {
      toast.error('Failed to duplicate form')
    }
  }

  const duplicateBaseForm = async (form, e, thenEdit = false) => {
    e.stopPropagation()
    try {
      const fieldDef = BASE_FORM_FIELDS[form.type] || {}
      const res = await axios.post('/api/custom-forms/duplicate-base', {
        name: form.name,
        description: form.description,
        department: form.department,
        color: form.color,
        icon: form.icon,
        pages: fieldDef.pages || [],
        fields: [],
      })
      if (thenEdit) {
        toast.success('Form copied — opening editor...')
        navigate(`/forms/builder/${res.data.id}`)
      } else {
        toast.success('Form duplicated with all fields — you can now edit it in the builder')
        loadAllSettings()
      }
    } catch {
      toast.error('Failed to duplicate form')
    }
  }

  const deleteCustomForm = async (customId, e) => {
    e.stopPropagation()
    if (!confirm('Delete this form and all its submissions?')) return
    try {
      await axios.delete(`/api/custom-forms/${customId}`)
      toast.success('Form deleted')
      loadAllSettings()
    } catch {
      toast.error('Failed to delete form')
    }
  }

  if (viewingSubmissions) {
    return (
      <div className="space-y-4 max-w-7xl">
        <button onClick={() => setViewingSubmissions(null)} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Forms
        </button>
        <SubmissionsTable formType={viewingSubmissions.type} formName={viewingSubmissions.name} />
      </div>
    )
  }

  // Shared action buttons used in both views
  const FormActions = ({ form }) => {
    const settings = formSettings[form.type]
    const isPublished = !!settings?.is_published
    const publicToken = settings?.public_token
    return (
      <div className="flex items-center gap-1">
        {form.isCustom ? (
          <button onClick={() => navigate(`/forms/builder/${form.customId}`)} title="Edit"
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        ) : (
          <button onClick={e => duplicateBaseForm(form, e, true)} title="Edit (creates editable copy)"
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        <button
          onClick={e => form.isCustom ? duplicateCustomForm(form.customId, e) : duplicateBaseForm(form, e, false)}
          title="Duplicate"
          className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        <button onClick={() => setSettingsForm(form)} title="Settings"
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        {isPublished && publicToken && (
          <button onClick={e => copyPublicLink(publicToken, e)} title="Copy public link"
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
        )}
        {form.isCustom && (
          <button onClick={e => deleteCustomForm(form.customId, e)} title="Delete"
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Forms & Tables</h1>
            <p className="text-gray-500 text-sm mt-1">Manage form submissions and access all form types</p>
          </div>
          <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-0.5">
            <button
              onClick={() => setViewMode('card')}
              title="Card view"
              className={`p-1.5 rounded-md transition ${viewMode === 'card' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="List view"
              className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => navigate('/forms/builder')}
            className="btn-primary flex items-center gap-2 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Create Form
          </button>
        </div>

        {/* Search + Sort bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by form name or department…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field pl-9 text-sm py-2"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          {/* Sort controls */}
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-gray-400 text-xs font-medium">Sort:</span>
            {[
              { key: 'name', label: 'Name' },
              { key: 'department', label: 'Department' },
              { key: 'status', label: 'Status' },
            ].map(opt => (
              <button key={opt.key} onClick={() => toggleSort(opt.key)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition
                  ${sortBy === opt.key ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                {opt.label}
                {sortBy === opt.key && (
                  <svg className={`w-3 h-3 transition-transform ${sortDir === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Results count */}
          {searchQuery && (
            <span className="text-xs text-gray-400 ml-1">{filteredForms.length} result{filteredForms.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {filteredForms.length === 0 ? (
        <div className="card p-12 text-center border-2 border-dashed border-gray-200">
          <p className="text-gray-400">{searchQuery ? 'No forms match your search.' : 'No forms yet.'}</p>
        </div>
      ) : viewMode === 'card' ? (
        /* ── CARD VIEW ── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredForms.map(form => {
            const c = getC(form.color)
            const settings = formSettings[form.type]
            const isPublished = !!settings?.is_published
            const publicToken = settings?.public_token
            const logoUrl = settings?.logo_url

            return (
              <div key={form.type} className={`card p-5 border ${c.border} hover:shadow-md transition-shadow flex flex-col gap-4`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {logoUrl ? (
                      <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center overflow-hidden`}>
                        <img src={logoUrl} alt="logo" className="w-10 h-10 object-contain" />
                      </div>
                    ) : (
                      <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center text-2xl`}>{form.icon}</div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{form.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`badge ${c.badge}`}>{form.department}</span>
                        {form.pages > 1 && <span className="badge bg-gray-100 text-gray-600">{form.pages} pages</span>}
                        {form.isCustom && (
                          <span className="badge bg-gray-100 text-gray-600">
                            {form.fieldCount} field{form.fieldCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`badge flex items-center gap-1 ${isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {loadingSettings ? '...' : isPublished ? 'Published' : 'Draft'}
                    </span>
                    <FormActions form={form} />
                  </div>
                </div>

                <p className="text-sm text-gray-500 leading-relaxed">{form.description}</p>

                {isPublished && publicToken && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    <span className="text-xs text-green-700 font-mono truncate flex-1">{window.location.origin}/f/{publicToken}</span>
                    <button onClick={e => copyPublicLink(publicToken, e)} className="text-green-600 hover:text-green-800 flex-shrink-0 p-1 rounded hover:bg-green-100 transition" title="Copy link">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                    <a href={`/f/${publicToken}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800 flex-shrink-0 p-1 rounded hover:bg-green-100 transition" title="Open">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => navigate(`/forms/${form.type}`)} className="btn-primary text-sm py-1.5 px-4 flex-1">
                    Open Form
                  </button>
                  <button onClick={() => setViewingSubmissions(form)} className={`text-sm py-1.5 px-4 rounded-lg border font-medium transition flex-1 ${c.btn}`}>
                    View Submissions
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── LIST VIEW ── */
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left">
                  <button onClick={() => toggleSort('name')} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition">
                    Form <SortIcon col="name" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button onClick={() => toggleSort('department')} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition">
                    Department <SortIcon col="department" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left hidden md:table-cell">
                  <button onClick={() => toggleSort('status')} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition">
                    Status <SortIcon col="status" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Public Link</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredForms.map(form => {
                const c = getC(form.color)
                const settings = formSettings[form.type]
                const isPublished = !!settings?.is_published
                const publicToken = settings?.public_token
                const logoUrl = settings?.logo_url

                return (
                  <tr key={form.type} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {logoUrl ? (
                          <div className={`w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0`}>
                            <img src={logoUrl} alt="logo" className="w-7 h-7 object-contain" />
                          </div>
                        ) : (
                          <div className={`w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center text-lg flex-shrink-0`}>{form.icon}</div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{form.name}</p>
                          {form.isCustom && (
                            <p className="text-xs text-gray-400">{form.fieldCount} field{form.fieldCount !== 1 ? 's' : ''}</p>
                          )}
                          {!form.isCustom && form.pages > 1 && (
                            <p className="text-xs text-gray-400">{form.pages} pages</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${c.badge}`}>{form.department}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`badge flex items-center gap-1 w-fit ${isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {loadingSettings ? '...' : isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {isPublished && publicToken ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-400 font-mono truncate max-w-[180px]">/f/{publicToken}</span>
                          <button onClick={e => copyPublicLink(publicToken, e)} className="text-gray-400 hover:text-green-600 p-0.5 rounded transition" title="Copy link">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          </button>
                          <a href={`/f/${publicToken}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 p-0.5 rounded transition" title="Open">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/forms/${form.type}`)}
                          className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                          Open
                        </button>
                        <button onClick={() => setViewingSubmissions(form)}
                          className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition ${c.btn}`}>
                          Submissions
                        </button>
                        <FormActions form={form} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {settingsForm && (
        <FormSettingsModal
          form={settingsForm}
          onClose={() => setSettingsForm(null)}
          onUpdate={loadAllSettings}
        />
      )}
    </div>
  )
}
