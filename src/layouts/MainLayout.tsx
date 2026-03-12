import { Outlet } from 'react-router-dom'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { HeaderBar } from '@/components/HeaderBar'
import { BottomNav } from '@/components/BottomNav'
import { UserMenu } from '@/components/UserMenu'

function HeaderActions() {
  return (
    <>
      {/* Mobile: menu toggle (UserMenu with dropdown). Desktop: same menu for nav, but Log out is visible in header. */}
      <div className="flex items-center gap-2">
        <Link
          to="/compliance"
          className="p-2 -m-2 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Compliance"
        >
          <span className="text-lg" aria-hidden>📋</span>
        </Link>
        {/* Desktop: visible Log out */}
        <DesktopLogout />
      </div>
    </>
  )
}

function DesktopLogout() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="hidden md:inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
    >
      Log out
    </button>
  )
}

export function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-14">
      <HeaderBar
        title="ElectroGrid"
        leftAction={<UserMenu />}
        rightAction={<HeaderActions />}
      />
      <main className="flex-1 p-4 sm:p-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
