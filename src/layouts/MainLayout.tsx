import { Outlet } from 'react-router-dom'
import { HeaderBar } from '@/components/HeaderBar'
import { BottomNav } from '@/components/BottomNav'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col pb-14">
      <HeaderBar
        title="Electrogrid"
        leftAction={
          <button
            type="button"
            className="p-2 -m-2 rounded-lg text-text-secondary hover:bg-gray-100"
            aria-label="Menu"
          >
            <span className="text-xl">☰</span>
          </button>
        }
        rightAction={
          <button
            type="button"
            className="p-2 -m-2 rounded-lg text-text-secondary hover:bg-gray-100"
            aria-label="Notifications"
          >
            <span className="text-xl">🔔</span>
          </button>
        }
      />
      <main className="flex-1 p-4 sm:p-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
