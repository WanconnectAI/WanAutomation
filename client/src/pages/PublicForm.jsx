import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Toaster } from 'react-hot-toast'
import JobApplicationForm from '../forms/JobApplicationForm'
import SeminarRegistrationForm from '../forms/SeminarRegistrationForm'
import StaffClaimForm from '../forms/StaffClaimForm'
import ClientRequestForm from '../forms/ClientRequestForm'
import DynamicFormView from '../components/DynamicFormView'

const FORM_COMPONENTS = {
  job_application: JobApplicationForm,
  seminar_registration: SeminarRegistrationForm,
  staff_claim: StaffClaimForm,
  client_request: ClientRequestForm,
}

export default function PublicForm() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch form config by public token (no auth)
    axios.get(`/api/public/form/${token}`)
      .then(r => setConfig(r.data))
      .catch(err => setError(err.response?.status === 404 ? 'not_found' : 'error'))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    if (!token) return
    // Intercept all /api/forms/submit* calls and redirect to the public endpoint
    const interceptor = axios.interceptors.request.use(config => {
      if (config.url?.startsWith('/api/forms/submit')) {
        const suffix = config.url.replace('/api/forms/submit', '')
        config.url = `/api/public/form/${token}/submit`
        // Append public token to FormData or JSON body
        if (config.data instanceof FormData) {
          config.data.append('_public_token', token)
        }
      }
      return config
    })
    return () => axios.interceptors.request.eject(interceptor)
  }, [token])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading form...</p>
      </div>
    </div>
  )

  if (error === 'not_found') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Form Not Available</h2>
        <p className="text-gray-500 text-sm">This form link is no longer active or has been unpublished.</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center"><p className="text-red-500">Something went wrong. Please try again.</p></div>
    </div>
  )

  const isCustom = config?.form_type?.startsWith('custom_')
  const customId = isCustom ? config.form_type.replace('custom_', '') : null
  const FormComponent = !isCustom ? FORM_COMPONENTS[config?.form_type] : null

  if (!isCustom && !FormComponent) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      {/* Public header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          {config?.logo_url ? (
            <img src={config.logo_url} alt="Company logo" className="h-10 max-w-48 object-contain" />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <span className="font-semibold text-gray-800">{config?.form_name || 'Form'}</span>
            </div>
          )}
          <span className="text-xs text-gray-400 hidden sm:block">Powered by OpsPortal</span>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {isCustom
          ? <DynamicFormView formId={customId} fields={config.fields || []} formName={config.form_name} />
          : <FormComponent />
        }
      </main>

      <footer className="text-center pb-8">
        <p className="text-xs text-gray-400">
          This form is powered by <span className="text-blue-500 font-medium">OpsPortal</span>
        </p>
      </footer>
    </div>
  )
}
