import { useAuth } from '../context/AuthContext'

/**
 * Permission hook — checks user.permissions[moduleKey][action]
 * Admin role bypasses all checks and always returns true.
 *
 * Usage:
 *   const { canView, canCreate, canEdit, canDelete } = usePermission()
 *   if (!canView('forms.list')) return <Navigate to="/dashboard" />
 *   {canCreate('forms.list') && <button>Create Form</button>}
 */
export function usePermission() {
  const { user } = useAuth()

  const can = (moduleKey, action = 'view') => {
    if (!user) return false
    if (user.role === 'admin') return true
    return user.permissions?.[moduleKey]?.[action] === true
  }

  return {
    can,
    canView:   (k) => can(k, 'view'),
    canCreate: (k) => can(k, 'create'),
    canEdit:   (k) => can(k, 'edit'),
    canDelete: (k) => can(k, 'delete'),
    isAdmin:   user?.role === 'admin',
  }
}
