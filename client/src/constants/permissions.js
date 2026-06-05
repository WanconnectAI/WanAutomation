// Shared permission module definitions
// Used by: UserManagement (matrix UI), Layout (nav filter), usePermission hook, App (route guards)

export const PERMISSION_MODULES = [
  {
    group: 'Overall',
    color: 'blue',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: '🏠', actions: ['view'] },
    ],
  },
  {
    group: 'Department AI',
    color: 'purple',
    items: [
      { key: 'dept.accounting', label: 'Accounting',  icon: '📊', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'dept.audit',      label: 'Audit',       icon: '🔍', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'dept.consulting', label: 'Consulting',  icon: '💼', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'dept.taxation',   label: 'Taxation',    icon: '🧾', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'dept.co-sec',     label: 'Co. Sec',     icon: '📋', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'dept.internal',   label: 'Internal',    icon: '🏢', actions: ['view', 'create', 'edit', 'delete'] },
    ],
  },
  {
    group: 'Forms',
    color: 'green',
    items: [
      { key: 'forms.dashboard',   label: 'Forms Dashboard',    icon: '📈', actions: ['view'] },
      { key: 'forms.list',        label: 'Forms',              icon: '📄', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'forms.submissions', label: 'Submission Details', icon: '📥', actions: ['view', 'delete'] },
    ],
  },
  {
    group: 'Automation',
    color: 'orange',
    items: [
      { key: 'automation.dashboard',  label: 'Automation Dashboard', icon: '⚡', actions: ['view'] },
      { key: 'automation.workflows',  label: 'Workflows',            icon: '🔄', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'automation.flows',      label: 'Flows',                icon: '▶', actions: ['view', 'create', 'edit', 'delete'] },
    ],
  },
  {
    group: 'System',
    color: 'red',
    items: [
      { key: 'users',    label: 'User Management', icon: '👥', actions: ['view', 'create', 'edit', 'delete'] },
      { key: 'settings', label: 'Settings',        icon: '⚙', actions: ['view', 'edit'] },
    ],
  },
]

/** Returns a fresh permissions object with all actions set to false */
export function getDefaultPermissions() {
  const perms = {}
  PERMISSION_MODULES.forEach(group => {
    group.items.forEach(item => {
      perms[item.key] = {}
      item.actions.forEach(action => { perms[item.key][action] = false })
    })
  })
  return perms
}

/** The 4 canonical action columns */
export const ACTION_COLS = ['view', 'create', 'edit', 'delete']

export const GROUP_COLORS = {
  blue:   { header: 'bg-blue-50 text-blue-700 border-blue-200',   tick: 'bg-blue-600' },
  purple: { header: 'bg-purple-50 text-purple-700 border-purple-200', tick: 'bg-purple-600' },
  green:  { header: 'bg-green-50 text-green-700 border-green-200',   tick: 'bg-green-600' },
  orange: { header: 'bg-orange-50 text-orange-700 border-orange-200', tick: 'bg-orange-600' },
  red:    { header: 'bg-red-50 text-red-700 border-red-200',         tick: 'bg-red-600' },
}
