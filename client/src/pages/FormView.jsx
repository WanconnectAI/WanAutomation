import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import JobApplicationForm from '../forms/JobApplicationForm'
import SeminarRegistrationForm from '../forms/SeminarRegistrationForm'
import StaffClaimForm from '../forms/StaffClaimForm'
import ClientRequestForm from '../forms/ClientRequestForm'
import DynamicFormView from '../components/DynamicFormView'

const BUILT_IN_FORMS = {
  job_application: { component: JobApplicationForm, title: 'Job Application Form' },
  seminar_registration: { component: SeminarRegistrationForm, title: 'Seminar Registration Form' },
  staff_claim: { component: StaffClaimForm, title: 'Staff Claim Form' },
  client_request: { component: ClientRequestForm, title: 'Client Request Form' },
}

export default function FormView() {
  const { formType } = useParams()
  const navigate = useNavigate()
  const [customForm, setCustomForm] = useState(null)
  const [loading, setLoading] = useState(false)

  const isCustom = formType?.startsWith('custom_')
  const customId = isCustom ? formType.replace('custom_', '') : null

  useEffect(() => {
    if (isCustom && customId) {
      setLoading(true)
      axios.get(`/api/custom-forms/${customId}`)
        .then(r => setCustomForm(r.data))
        .catch(() => setCustomForm(null))
        .finally(() => setLoading(false))
    }
  }, [isCustom, customId])

  const Back = () => (
    <button onClick={() => navigate('/forms')} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
      Back to Forms
    </button>
  )

  if (isCustom) {
    if (loading) return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Back />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
    if (!customForm) return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Back />
        <div className="text-center py-20">
          <p className="text-gray-500">Form not found.</p>
        </div>
      </div>
    )
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Back />
        <DynamicFormView formId={customId} fields={customForm.fields} formName={customForm.name} />
      </div>
    )
  }

  const form = BUILT_IN_FORMS[formType]
  if (!form) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Form not found.</p>
      <button onClick={() => navigate('/forms')} className="btn-primary mt-4">Back to Forms</button>
    </div>
  )

  const FormComponent = form.component
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Back />
      <FormComponent />
    </div>
  )
}
