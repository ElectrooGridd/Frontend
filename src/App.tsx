import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from '@/components/ToastNotification'
import { useAuthStore } from '@/store/authStore'
import { useHydrateStores } from '@/store'
import { AuthLayout } from '@/layouts/AuthLayout'
import { MainLayout } from '@/layouts/MainLayout'

// ---------------------------------------------------------------------------
// Lazy-loaded route components — each becomes its own chunk
// ---------------------------------------------------------------------------
const Landing = lazy(() => import('@/features/landing/Landing').then((m) => ({ default: m.Landing })))
const Login = lazy(() => import('@/features/auth/Login').then((m) => ({ default: m.Login })))
const Register = lazy(() => import('@/features/auth/Register').then((m) => ({ default: m.Register })))
const ForgotPassword = lazy(() => import('@/features/auth/ForgotPassword').then((m) => ({ default: m.ForgotPassword })))
const ResetPassword = lazy(() => import('@/features/auth/ResetPassword').then((m) => ({ default: m.ResetPassword })))
const VerifyEmail = lazy(() => import('@/features/auth/VerifyEmail').then((m) => ({ default: m.VerifyEmail })))
const Dashboard = lazy(() => import('@/features/dashboard/Dashboard').then((m) => ({ default: m.Dashboard })))
const MeterRechargeFlow = lazy(() => import('@/features/recharge/MeterRechargeFlow').then((m) => ({ default: m.MeterRechargeFlow })))
const RechargeHistory = lazy(() => import('@/features/recharge/RechargeHistory').then((m) => ({ default: m.RechargeHistory })))
const MyMeters = lazy(() => import('@/features/meters/MyMeters').then((m) => ({ default: m.MyMeters })))

// ---------------------------------------------------------------------------
// Branded loading spinner — shown while lazy chunks download or session restores
// ---------------------------------------------------------------------------
function RouteSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
      <img
        src="/images/logo.png"
        alt="ElectroGrid"
        className="w-14 h-14 object-contain animate-pulse"
      />
      <div className="w-[120px] h-[3px] bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full w-[40%] bg-teal-600 rounded-full animate-[slide_1s_ease-in-out_infinite]" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Route guards
// ---------------------------------------------------------------------------
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken)
  const isRestoring = useAuthStore((s) => s.isRestoring)
  // While the session is being restored from the cookie, show spinner
  if (isRestoring) return <RouteSpinner />
  if (!token) return <Navigate to="/" replace />
  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken)
  const isRestoring = useAuthStore((s) => s.isRestoring)
  const location = useLocation()
  // Public routes render immediately — don't wait for session restore
  if (isRestoring) return <>{children}</>
  if (token) {
    // If the user just logged in from Buy on the Fly, forward to /recharge with the state
    const state = location.state as { quickRecharge?: unknown } | null
    if (state?.quickRecharge) {
      return <Navigate to="/recharge" replace state={{ quickRecharge: state.quickRecharge }} />
    }
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

export default function App() {
  const restoreSession = useAuthStore((s) => s.restoreSession)

  // On app boot, silently exchange the httpOnly cookie for an access token (#6, #8)
  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  // Hydrate domain stores when auth state settles
  useHydrateStores()

  return (
    <Toaster>
      <Suspense fallback={<RouteSpinner />}>
        <Routes>
          <Route path="/" element={<LandingOrRedirect />} />
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
            <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
            <Route path="/reset-password" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />
            <Route path="/verify-email" element={<PublicOnlyRoute><VerifyEmail /></PublicOnlyRoute>} />
          </Route>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/meters" element={<ProtectedRoute><MyMeters /></ProtectedRoute>} />
            <Route path="/recharge" element={<ProtectedRoute><MeterRechargeFlow /></ProtectedRoute>} />
            <Route path="/recharge/history" element={<ProtectedRoute><RechargeHistory /></ProtectedRoute>} />
          </Route>
          <Route path="/welcome" element={<Navigate to="/" replace />} />
          <Route path="*" element={<AuthRedirect />} />
        </Routes>
      </Suspense>
    </Toaster>
  )
}

function AuthRedirect() {
  const token = useAuthStore((s) => s.accessToken)
  const isRestoring = useAuthStore((s) => s.isRestoring)
  if (isRestoring) return <RouteSpinner />
  return <Navigate to={token ? '/dashboard' : '/'} replace />
}

function LandingOrRedirect() {
  const token = useAuthStore((s) => s.accessToken)
  const isRestoring = useAuthStore((s) => s.isRestoring)
  // Show landing page immediately — don't block on session restore
  if (isRestoring) return <Landing />
  if (token) return <Navigate to="/dashboard" replace />
  return <Landing />
}

//