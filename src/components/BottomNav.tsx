import { Link, useLocation } from 'react-router-dom'

const nav = [
  { to: '/dashboard', label: 'Home', icon: '🏠' },
  { to: '/recharge', label: 'Top Up', icon: '⚡' },
  { to: '/recharge/history', label: 'History', icon: '📋' },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-gray-100 safe-area-pb z-40">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        {nav.map(({ to, label, icon }) => {
          const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              className={`
                flex flex-col items-center justify-center flex-1 h-full text-xs font-medium
                ${isActive ? 'text-primary' : 'text-text-secondary'}
              `}
            >
              <span className="text-lg mb-0.5" aria-hidden>{icon}</span>
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
