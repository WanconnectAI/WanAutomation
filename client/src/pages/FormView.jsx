import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import JobApplicationForm from '../forms/JobApplicationForm'
import SeminarRegistrationForm from '../forms/SeminarRegistrationForm'
import StaffClaimForm from '../forms/StaffClaimForm'
import ClientRequestForm from '../forms/ClientRequestForm'

const forms = {
  job_application: { component: JobApplicationForm, title: 'Job Application Form' },
  seminar_registration: { component: SeminarRegistrationForm, title: 'Seminar Registration Form' },
  staff_claim: { component: StaffClaimForm, title: 'Staff Claim Form' },
  client_request: { component: ClientRequestForm, title: 'Client Request Form' },
}

export default function FormView() {
  const { formType } = useParams()
  const navigate = useNavigate()
  const form = forms[formType]

  if (!form) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Form not found.</p>
      <button onClick={() => navigate('/forms')} className="btn-primary mt-4">Back to Forms</button>
    </div>
  )

  const FormComponent = form.component
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <button onClick={() => navigate('/forms')} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to Forms
      </button>
      <FormComponent />
    </div>
  )
}
