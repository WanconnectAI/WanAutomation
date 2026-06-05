import React, { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { PERMISSION_MODULES, ACTION_COLS, GROUP_COLORS, getDefaultPermissions } from '../constants/permissions'

// ── Permission Matrix ─────────────────────────────────────────────────────────
function PermissionMatrix({ permissions, onChange, disabled }) {
  const toggle = (moduleKey, action) => {
    const updated = {
      ...permissions,
      [moduleKey]: {
        ...(permissions[moduleKey] || {}),
        [action]: !(permissions[moduleKey]?.[action]),
      },
    }
    onChange(updated)
  }

  const toggleGroupView = (groupItems, value) => {
    const updated = { ...permissions }
    groupItems.forEach(item => {
      if (item.actions.includes('view')) {
        updated[item.key] = { ...(updated[item.key] || {}), view: value }
        // If removing view, remove all other permissions too
        if (!value) {
          item.actions.forEach(a => { updated[item.key][a] = false })
        }
      }
    })
    onChange(updated)
  }

  const allGroupViewed = (groupItems) =>
    groupItems.every(item => permissions[item.key]?.view === true)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
      {/* Column headers */}
      <div className="grid bg-gray-50 border-b border-gray-200 sticky top-0" style={{ gridTemplateColumns: '1fr repeat(4, 56px)' }}>
        <div className="px-3 py-2 font-semibold text-gray-500 uppercase tracking-wide">Module</div>
        {ACTION_COLS.map(a => (
          <div key={a} className="py-2 text-center font-semibold text-gray-500 uppercase tracking-wide capitalize">{a}</div>
        ))}
      </div>

      {PERMISSION_MODULES.map(group => {
        const gc = GROUP_COLORS[group.color] || GROUP_COLORS.blue
        const allViewed = allGroupViewed(group.items)
        return (
          <div key={group.group}>
            {/* Group header row */}
            <div className={`grid items-center border-b ${gc.header} border-opacity-50`}
              style={{ gridTemplateColumns: '1fr repeat(4, 56px)' }}>
              <div className="px-3 py-1.5 font-semibold text-xs flex items-center gap-2">
                {group.group}
                {!disabled && (
                  <button type="button"
                    onClick={() => toggleGroupView(group.items, !allViewed)}
                    className="text-[10px] font-normal underline opacity-60 hover:opacity-100">
                    {allViewed ? 'hide all' : 'show all'}
                  </button>
                )}
              </div>
              {ACTION_COLS.map(a => <div key={a} />)}
            </div>

            {/* Module rows */}
            {group.items.map(item => {
              const perms = permissions[item.key] || {}
              const hasView = perms.view === true
              return (
                <div key={item.key}
                  className={`grid items-center border-b border-gray-100 last:border-0 transition-colors ${hasView ? 'bg-white' : 'bg-gray-50/50'}`}
                  style={{ gridTemplateColumns: '1fr repeat(4, 56px)' }}>
                  <div className={`px-3 py-2 flex items-center gap-1.5 ${!hasView ? 'opacity-40' : ''}`}>
                    <span className="text-sm">{item.icon}</span>
                    <span className="font-medium text-gray-700">{item.label}</span>
                  </div>
                  {ACTION_COLS.map(action => {
                    const supported = item.actions.includes(action)
                    const checked = perms[action] === true
                    const isViewCol = action === 'view'
                    const blocked = !isViewCol && !hasView // can't grant non-view if view is off
                    return (
                      <div key={action} className="flex items-center justify-center py-2">
                        {supported ? (
                          <button
                            type="button"
                            disabled={disabled || blocked}
                            onClick={() => toggle(item.key, action)}
                            title={blocked ? 'Enable View first' : `${checked ? 'Remove' : 'Grant'} ${action}`}
                            className={`w-5 h-5 rounded flex items-center justify-center border transition
                              ${disabled || blocked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}
                              ${checked && !blocked
                                ? `${gc.tick} border-transparent`
                                : 'bg-white border-gray-300'}`}
                          >
                            {checked && !blocked && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ) : (
                          <span className="w-5 h-5 flex items-center justify-center text-gray-200 text-base">—</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// ── User Modal ────────────────────────────────────────────────────────────────
function UserModal({ user, onClose, onSaved }) {
  const isEdit = !!user
  const [form, setForm] = useState({
    username: user?.username || '',
    password: '',
    confirmPassword: '',
    role: user?.role || 'staff',
    permissions: user?.permissions || getDefaultPermissions(),
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isEdit && !form.password) return toast.error('Password is required')
    if (form.password && form.password !== form.confirmPassword) return toast.error('Passwords do not match')
    if (form.password && form.password.length < 6) return toast.error('Password must be at least 6 characters')

    setSaving(true)
    try {
      if (isEdit) {
        const payload = { role: form.role, permissions: form.permissions }
        if (form.password) payload.password = form.password
        await axios.put(`/api/users/${user.id}`, payload)
        toast.success('User updated')
      } else {
        await axios.post('/api/users', {
          username: form.username,
          password: form.password,
          role: form.role,
          permissions: form.permissions,
        })
        toast.success(`User "${form.username}" created`)
      }
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white rounded-t-xl z-10">
          <h3 className="font-semibold text-gray-900">{isEdit ? `Edit User — ${user.username}` : 'Create New User'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Basic fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input type="text" required autoFocus value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className="input w-full" placeholder="e.g. john.doe" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="input w-full">
                <option value="admin">Admin — full access (no restrictions)</option>
                <option value="staff">Staff — custom permissions below</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isEdit ? 'New Password (leave blank to keep)' : 'Password'}
              </label>
              <input type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="input w-full" placeholder={isEdit ? 'Leave blank to keep current' : 'Min. 6 characters'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input type="password" value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                className="input w-full" placeholder="Re-enter password" />
            </div>
          </div>

          {/* Permission matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Access Permissions</label>
              {form.role === 'admin' ? (
                <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                  Admin — all permissions granted automatically
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => {
                    const all = {}
                    PERMISSION_MODULES.forEach(g => g.items.forEach(item => {
                      all[item.key] = {}
                      item.actions.forEach(a => { all[item.key][a] = true })
                    }))
                    setForm(f => ({ ...f, permissions: all }))
                  }} className="text-xs text-green-600 hover:text-green-800 font-medium">Grant all</button>
                  <span className="text-gray-200">|</span>
                  <button type="button" onClick={() => setForm(f => ({ ...f, permissions: getDefaultPermissions() }))}
                    className="text-xs text-red-500 hover:text-red-700 font-medium">Revoke all</button>
                </div>
              )}
            </div>

            {form.role === 'admin' ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Admin has full access to all modules, create, edit, delete, and view.
              </div>
            ) : (
              <PermissionMatrix
                permissions={form.permissions}
                onChange={perms => setForm(f => ({ ...f, permissions: perms }))}
                disabled={false}
              />
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-60 text-sm">
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function PermissionSummary({ user }) {
  if (user.role === 'admin') {
    return <span className="text-xs text-blue-600 font-medium">Full access</span>
  }
  const perms = user.permissions || {}
  const granted = Object.entries(perms).filter(([, v]) => v.view === true)
  if (granted.length === 0) return <span className="text-xs text-gray-300 italic">No access</span>
  return (
    <div className="flex flex-wrap gap-1 max-w-xs">
      {granted.slice(0, 4).map(([key]) => {
        const allMods = PERMISSION_MODULES.flatMap(g => g.items)
        const mod = allMods.find(m => m.key === key)
        return mod ? (
          <span key={key} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">
            {mod.icon} {mod.label}
          </span>
        ) : null
      })}
      {granted.length > 4 && (
        <span className="text-[10px] text-gray-400">+{granted.length - 4} more</span>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UserManagement() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const fetchUsers = async () => {
    try {
      const r = await axios.get('/api/users')
      setUsers(r.data)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/users/${id}`)
      toast.success('User deleted')
      setDeleteConfirm(null)
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete user')
    }
  }

  const roleColor = (role) => role === 'admin'
    ? 'bg-blue-100 text-blue-700'
    : 'bg-gray-100 text-gray-600'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage login accounts, roles, and module access permissions</p>
        </div>
        <button onClick={() => setModal('create')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex gap-3 text-sm text-blue-800">
        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span><strong>Admin</strong> role has full access to everything. <strong>Staff</strong> role can be restricted by module — set View, Create, Edit, Delete per section.</span>
      </div>

      {/* Users table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Username</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Access Summary</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Created</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.username}</p>
                        {u.username === currentUser?.username && (
                          <span className="text-xs text-green-600 font-medium">You</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${roleColor(u.role)}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <PermissionSummary user={u} />
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">
                    {new Date(u.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setModal(u)}
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit
                      </button>
                      <button onClick={() => setDeleteConfirm(u)}
                        disabled={u.username === currentUser?.username}
                        className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition font-medium disabled:opacity-30 disabled:cursor-not-allowed">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Default credentials reminder */}
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 space-y-1">
        <p className="font-semibold flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6v.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
          </svg>
          Default credentials — change before going live
        </p>
        <p className="text-xs text-red-600 font-mono">admin / admin123 &nbsp;·&nbsp; opsmanager / ops456</p>
      </div>

      {/* Create / Edit modal */}
      {modal && (
        <UserModal
          user={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={fetchUsers}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete "{deleteConfirm.username}"?</h3>
                <p className="text-sm text-gray-500">This user will lose portal access immediately.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm.id)}
                className="flex-1 text-sm py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium">
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
