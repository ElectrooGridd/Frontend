import { Outlet, Link, useLocation } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useNotificationsStore } from '@/store/notificationsStore'
import { HeaderBar } from '@/components/HeaderBar'
import { BottomNav } from '@/components/BottomNav'
import { UserMenu } from '@/components/UserMenu'

const sidebarNav = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    section: 'main',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    to: '/recharge',
    label: 'Top Up',
    section: 'main',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    to: '/recharge/history',
    label: 'History',
    section: 'main',
    icon: (_active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8v4l3 3" />
        <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
      </svg>
    ),
  },
  {
    to: '#',
    label: 'Analytics',
    section: 'insights',
    icon: (_active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10" />
        <path d="M12 20V4" />
        <path d="M6 20v-6" />
      </svg>
    ),
  },
  {
    to: '#',
    label: 'Alerts',
    section: 'insights',
    badge: true,
    icon: (_active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    to: '#',
    label: 'Settings',
    section: 'other',
    icon: (_active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

function DesktopSidebar() {
  const location = useLocation()
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const unreadCount = useNotificationsStore((s) => s.unreadCount)

  const mainItems = sidebarNav.filter((i) => i.section === 'main')
  const insightItems = sidebarNav.filter((i) => i.section === 'insights')
  const otherItems = sidebarNav.filter((i) => i.section === 'other')

  const renderNavItem = ({ to, label, icon, badge }: typeof sidebarNav[0]) => {
    const isActive = to !== '#' && (location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to)))
    const isDisabled = to === '#'

    const classes = `
      group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200
      ${isActive
        ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
        : isDisabled
          ? 'text-slate-400 cursor-default'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }
    `

    const content = (
      <>
        <span className={`flex-shrink-0 ${isActive ? 'text-white' : isDisabled ? 'text-slate-300' : 'text-slate-400 group-hover:text-slate-600'}`}>
          {icon(isActive)}
        </span>
        <span className="flex-1">{label}</span>
        {badge && unreadCount > 0 && (
          <span className={`min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1 ${
            isActive ? 'bg-white text-teal-600' : 'bg-red-500 text-white'
          }`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {isDisabled && <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Soon</span>}
      </>
    )

    if (isDisabled) return <div key={label} className={classes}>{content}</div>
    return <Link key={label} to={to} className={classes}>{content}</Link>
  }

  return (
    <aside className="hidden md:flex md:w-[250px] lg:w-[270px] flex-col bg-white border-r border-slate-200/60">
      {/* Logo */}
      <div className="px-5 pt-6 pb-8">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-600/20 group-hover:shadow-teal-600/30 transition-shadow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <span className="text-[15px] font-bold text-slate-900 tracking-tight block">ElectroGrid</span>
            <span className="text-[11px] text-slate-400 font-medium">Energy Console</span>
          </div>
        </Link>
      </div>

      {/* Navigation sections */}
      <nav className="flex-1 px-3 space-y-6 overflow-y-auto">
        <div>
          <p className="px-3 mb-2 text-[10px] font-bold text-slate-300 uppercase tracking-[0.08em]">Menu</p>
          <div className="space-y-1">{mainItems.map(renderNavItem)}</div>
        </div>
        <div>
          <p className="px-3 mb-2 text-[10px] font-bold text-slate-300 uppercase tracking-[0.08em]">Insights</p>
          <div className="space-y-1">{insightItems.map(renderNavItem)}</div>
        </div>
        <div>
          <p className="px-3 mb-2 text-[10px] font-bold text-slate-300 uppercase tracking-[0.08em]">Other</p>
          <div className="space-y-1">{otherItems.map(renderNavItem)}</div>
        </div>
      </nav>

      {/* User / Logout */}
      <div className="p-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => { logout(); navigate('/') }}
          className="group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-red-500 transition-colors">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log out
        </button>
      </div>
    </aside>
  )
}

function MobileHeader() {
  return (
    <HeaderBar
      title="ElectroGrid"
      leftAction={<UserMenu />}
      rightAction={
        <Link
          to="/recharge"
          className="w-9 h-9 rounded-xl bg-teal-50 hover:bg-teal-100 flex items-center justify-center transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </Link>
      }
      className="md:hidden"
    />
  )
}

export function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <MobileHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
