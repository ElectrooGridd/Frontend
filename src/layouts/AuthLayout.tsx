import { Outlet, Link, useLocation } from 'react-router-dom'

const authPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email']

export function AuthLayout() {
  const location = useLocation()
  const backTo = authPaths.includes(location.pathname) ? '/' : '/'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 sm:p-6">
      <header className="flex items-center gap-3 mb-6 max-w-md mx-auto w-full">
        <Link
          to={backTo}
          className="p-2 -m-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Back"
        >
          ←
        </Link>
        <Link to="/" className="text-lg font-semibold text-slate-900 hover:text-teal-600 transition-colors">
          ElectroGrid
        </Link>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <Outlet />
      </div>
    </div>
  )
}
