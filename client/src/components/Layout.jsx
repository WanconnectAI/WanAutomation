import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

// ---- Icons ----
const icons = {
  dashboard: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  forms: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  automation: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  student: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  ),
  client: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  dept: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  chevronDown: (
    <svg className="w-4 h-4 flex-shrink-0 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  subDot: (
    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
}

// ---- Nav structure ----
// type: 'link'  => single item
// type: 'group' => expandable section with children
const NAV_STRUCTURE = [
  {
    type: 'link',
    to: '/dashboard',
    label: 'Overall',
    icon: icons.dashboard,
  },
  {
    type: 'group',
    id: 'dept-ai',
    label: 'Department AI',
    icon: icons.dept,
    basePath: '/dept',
    children: [
      { to: '/dept/accounting', label: 'Accounting',  deptId: 'accounting'  },
      { to: '/dept/audit',      label: 'Audit',       deptId: 'audit'       },
      { to: '/dept/consulting', label: 'Consulting',  deptId: 'consulting'  },
      { to: '/dept/taxation',   label: 'Taxation',    deptId: 'taxation'    },
      { to: '/dept/co-sec',     label: 'Co. Sec',     deptId: 'co-sec'      },
      { to: '/dept/internal',   label: 'Internal',    deptId: 'internal'    },
    ],
  },
  {
    type: 'group',
    id: 'forms',
    label: 'Forms',
    icon: icons.forms,
    basePath: '/forms',
    children: [
      { to: '/forms/dashboard', label: 'Forms Dashboard' },
      { to: '/forms', label: 'Forms', exact: true },
      { to: '/forms/submissions', label: 'Submission Details' },
    ],
  },
  {
    type: 'group',
    id: 'automation',
    label: 'Automation',
    icon: icons.automation,
    basePath: '/automation',
    children: [
      { to: '/automation/dashboard', label: 'Automation Dashboard' },
      { to: '/automation/workflows', label: 'Automation Workflows' },
      { to: '/automation/flows', label: 'Automation Flows' },
    ],
  },
  {
    type: 'group',
    id: 'student-portal',
    label: 'Student Portal',
    icon: icons.student,
    basePath: '/student-portal',
    comingSoon: true,
    children: [
      { to: '/student-portal/dashboard', label: 'Student Dashboard' },
      { to: '/student-portal/students', label: 'Student Listing' },
      { to: '/student-portal/courses', label: 'Course Listing' },
      { to: '/student-portal/enrollments', label: 'Enrollment Details' },
    ],
  },
  {
    type: 'link',
    to: '/client-portal',
    label: 'Client Portal',
    icon: icons.client,
    comingSoon: true,
  },
  {
    type: 'link',
    to: '/users',
    label: 'User Management',
    icon: icons.users,
  },
  {
    type: 'link',
    to: '/settings',
    label: 'Settings',
    icon: icons.settings,
  },
]

function SoonBadge() {
  return (
    <span className="ml-auto text-[10px] font-semibold tracking-wide bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded flex-shrink-0">
      SOON
    </span>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Track which groups are expanded. Auto-expand group if current path is inside it.
  const getInitialExpanded = () => {
    const expanded = {}
    NAV_STRUCTURE.forEach(item => {
      if (item.type === 'group') {
        const isActive = location.pathname.startsWith(item.basePath)
        expanded[item.id] = isActive
      }
    })
    return expanded
  }
  const [expanded, setExpanded] = useState(getInitialExpanded)

  const toggleGroup = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/')
  }

  const closeMobile = () => setMobileSidebarOpen(false)

  // Determine if a child sub-item is the active route.
  // For the /forms (exact) entry, we match only exactly /forms.
  const isSubItemActive = (child) => {
    if (child.exact) return location.pathname === child.to
    return location.pathname === child.to || location.pathname.startsWith(child.to + '/')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
        {sidebarOpen ? (
          <div className="flex flex-col gap-2 w-full">
            <img src="/logo-wanconnect.png" alt="Wanconnect Consulting Group" className="h-10 object-contain object-left" />
            <div className="border-t border-gray-100 pt-2">
              <img src="/logo-ccl.png" alt="CCL & Partners PLT" className="h-7 object-contain object-left"
                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
              <div style={{ display: 'none' }} className="items-center gap-1.5">
                <div className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center text-white text-xs font-bold">C</div>
                <span className="text-xs font-semibold text-slate-700">CCL & Partners PLT</span>
              </div>
            </div>
          </div>
        ) : (
          <img src="/logo-wc-icon.jpg" alt="WC" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_STRUCTURE.map((item) => {
          // Hide Department AI group entirely for staff with no department access
          if (item.id === 'dept-ai' && user?.role !== 'admin') {
            const accessible = item.children.filter(c => (user?.departments || []).includes(c.deptId))
            if (accessible.length === 0) return null
          }

          if (item.type === 'link') {
            // Single nav item
            const isActive = item.to === '/dashboard'
              ? location.pathname === '/dashboard'
              : (location.pathname === item.to || location.pathname.startsWith(item.to + '/'))

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMobile}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                {item.icon}
                {sidebarOpen && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.comingSoon && <SoonBadge />}
                  </>
                )}
              </NavLink>
            )
          }

          if (item.type === 'group') {
            const isGroupActive = location.pathname.startsWith(item.basePath)
            const isOpen = expanded[item.id]

            return (
              <div key={item.id}>
                {/* Group header button */}
                <button
                  onClick={() => {
                    if (sidebarOpen) {
                      toggleGroup(item.id)
                    } else {
                      // When collapsed, expand sidebar and open the group
                      setSidebarOpen(true)
                      setExpanded(prev => ({ ...prev, [item.id]: true }))
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isGroupActive ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                >
                  {item.icon}
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {item.comingSoon && <SoonBadge />}
                      <ChevronIcon open={isOpen} />
                    </>
                  )}
                </button>

                {/* Sub-items */}
                {sidebarOpen && isOpen && (
                  <div className="mt-0.5 ml-3 pl-3 border-l border-gray-200 space-y-0.5">
                    {item.children
                      .filter(child => {
                        // Department AI: filter by user's department access
                        if (!child.deptId) return true
                        return user?.role === 'admin' || (user?.departments || []).includes(child.deptId)
                      })
                      .map(child => {
                      const childActive = isSubItemActive(child)
                      return (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          end={child.exact}
                          onClick={closeMobile}
                          className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${childActive ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
                        >
                          <svg className="w-3 h-3 flex-shrink-0 opacity-60" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          <span className="truncate">{child.label}</span>
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          return null
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-gray-100 p-3">
        <div className={`flex items-center gap-3 ${sidebarOpen ? '' : 'justify-center'}`}>
          <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          {sidebarOpen && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-800 truncate">{user?.username}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-200 ${sidebarOpen ? 'w-56' : 'w-16'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <aside className={`md:hidden fixed inset-y-0 left-0 z-30 w-56 bg-white border-r border-gray-200 transform transition-transform duration-200 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSidebarOpen(!sidebarOpen); setMobileSidebarOpen(!mobileSidebarOpen) }}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-semibold text-gray-800 text-sm hidden sm:block">Wanconnect Operations Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">Welcome, <strong className="text-gray-700">{user?.username}</strong></span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
