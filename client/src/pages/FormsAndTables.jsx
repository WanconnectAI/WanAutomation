import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SubmissionsTable from '../components/SubmissionsTable'

const forms = [
  { type: 'job_application', name: 'Job Application Form', description: 'Multi-step employment application with personal info, education, employment history, references, and digital signature.', department: 'HR', status: 'Active', color: 'purple', icon: '📋', pages: 5 },
  { type: 'seminar_registration', name: 'Seminar Registration Form', description: 'Quick registration for company seminars and training events with dietary and accessibility requirements.', department: 'Training', status: 'Active', color: 'green', icon: '🎓', pages: 1 },
  { type: 'staff_claim', name: 'Staff Claim Form', description: 'Submit expense claims for medical, travel, meals, and other work-related expenses with receipt upload.', department: 'Finance', status: 'Active', color: 'orange', icon: '💰', pages: 1 },
  { type: 'client_request', name: 'Client Request Form', description: 'Submit service requests, project inquiries, or support tickets from external clients with priority assignment.', department: 'Operations', status: 'Active', color: 'blue', icon: '📝', pages: 1 },
]

const colorMap = {
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', btn: 'border-purple-200 text-purple-700 hover:bg-purple-50' },
  green: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', btn: 'border-green-200 text-green-700 hover:bg-green-50' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', btn: 'border-orange-200 text-orange-700 hover:bg-orange-50' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', btn: 'border-blue-200 text-blue-700 hover:bg-blue-50' },
}

export default function FormsAndTables() {
  const navigate = useNavigate()
  const [viewingSubmissions, setViewingSubmissions] = useState(null)

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

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Forms & Tables</h1>
        <p className="text-gray-500 text-sm mt-1">Manage form submissions and access all form types</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {forms.map(form => {
          const c = colorMap[form.color]
          return (
            <div key={form.type} className={`card p-5 border ${c.border} hover:shadow-md transition-shadow`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center text-2xl`}>{form.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{form.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge ${c.badge}`}>{form.department}</span>
                      {form.pages > 1 && <span className="badge bg-gray-100 text-gray-600">{form.pages} pages</span>}
                    </div>
                  </div>
                </div>
                <span className={`badge ${form.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{form.status}</span>
              </div>

              <p className="text-sm text-gray-500 mb-4 leading-relaxed">{form.description}</p>

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
    </div>
  )
}
