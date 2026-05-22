import React from 'react'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const { user } = useAuth()
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Portal configuration and preferences</p>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-700 border-b border-gray-100 pb-3">Account Information</h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xl font-bold">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.username}</p>
            <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm pt-2">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">Username</p>
            <p className="font-medium text-gray-800">{user?.username}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">Role</p>
            <p className="font-medium text-gray-800 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-700 border-b border-gray-100 pb-3">System Information</h2>
        {[
          ['Application', 'Operations Portal v1.0.0'],
          ['Frontend', 'React + Vite + Tailwind CSS'],
          ['Backend', 'Node.js + Express'],
          ['Database', 'SQLite (better-sqlite3)'],
          ['Authentication', 'JWT (8-hour sessions)'],
          ['File Storage', 'Local (server/uploads/)'],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-500">{k}</span>
            <span className="text-sm font-medium text-gray-700">{v}</span>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-700 border-b border-gray-100 pb-3 mb-4">Available Forms</h2>
        {[
          { name: 'Job Application Form', type: 'job_application', pages: 5, dept: 'HR' },
          { name: 'Seminar Registration Form', type: 'seminar_registration', pages: 1, dept: 'Training' },
          { name: 'Staff Claim Form', type: 'staff_claim', pages: 1, dept: 'Finance' },
          { name: 'Client Request Form', type: 'client_request', pages: 1, dept: 'Operations' },
        ].map(f => (
          <div key={f.type} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-800">{f.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{f.dept} · {f.pages} page{f.pages > 1 ? 's' : ''}</p>
            </div>
            <span className="badge bg-green-100 text-green-700">Active</span>
          </div>
        ))}
      </div>

      <div className="card p-6 border border-blue-100 bg-blue-50">
        <h2 className="font-semibold text-blue-800 mb-2">Deployment & Hosting Recommendations</h2>
        <div className="space-y-2 text-sm text-blue-700">
          <p>• <strong>Frontend (React):</strong> Deploy to <strong>Vercel</strong> or <strong>Netlify</strong> — free tier, instant CI/CD from GitHub</p>
          <p>• <strong>Backend (Node.js):</strong> Deploy to <strong>Railway</strong>, <strong>Render</strong>, or <strong>Fly.io</strong> — affordable, supports persistent storage</p>
          <p>• <strong>Database:</strong> For production, migrate from SQLite to <strong>PostgreSQL</strong> (Railway/Supabase free tier available)</p>
          <p>• <strong>Files/Uploads:</strong> Move to <strong>AWS S3</strong> or <strong>Cloudflare R2</strong> for persistent file storage in production</p>
          <p>• <strong>Full-stack single host:</strong> <strong>Railway</strong> or <strong>Render</strong> can host both frontend and backend together</p>
        </div>
      </div>
    </div>
  )
}
