import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import WelcomePage from './pages/WelcomePage'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import FormsAndTables from './pages/FormsAndTables'
import Workflows from './pages/Workflows'
import Settings from './pages/Settings'
import FormView from './pages/FormView'
import FormBuilder from './pages/FormBuilder'
import PublicForm from './pages/PublicForm'
import Automations from './pages/Automations'
import UserManagement from './pages/UserManagement'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading portal...</p>
      </div>
    </div>
  )
  return user ? children : <Navigate to="/" replace />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <WelcomePage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="forms" element={<FormsAndTables />} />
        <Route path="forms/builder" element={<FormBuilder />} />
        <Route path="forms/builder/:id" element={<FormBuilder />} />
        <Route path="forms/:formType" element={<FormView />} />
        <Route path="workflows" element={<Workflows />} />
        <Route path="automations" element={<Automations />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      {/* Public form route — no auth required */}
      <Route path="/f/:token" element={<PublicForm />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: '8px', fontSize: '14px' } }} />
      </BrowserRouter>
    </AuthProvider>
  )
}
