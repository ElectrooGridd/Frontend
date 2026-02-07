import { Outlet, Link, useLocation } from 'react-router-dom'

export function AuthLayout() {
  const location = useLocation()
  const isLogin = location.pathname === '/login'
  const isRegister = location.pathname === '/register'
  const backTo = isLogin || isRegister ? '/welcome' : '/welcome'

  return (
    <div className="min-h-screen bg-background flex flex-col p-4 sm:p-6">
      <header className="flex items-center gap-3 mb-6 max-w-md mx-auto w-full">
        <Link
          to={backTo}
          className="p-2 -m-2 rounded-lg text-text-secondary hover:bg-gray-100"
          aria-label="Back"
        >
          ←
        </Link>
        <h1 className="text-lg font-semibold text-text-primary">Electrogrid</h1>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <Outlet />
      </div>
    </div>
  )
}
