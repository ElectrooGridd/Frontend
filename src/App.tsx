import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ToastNotification'
import { useAuthStore } from '@/store/authStore'
import { useHydrateStores } from '@/store'
import { AuthLayout } from '@/layouts/AuthLayout'
import { MainLayout } from '@/layouts/MainLayout'
import { Landing } from '@/features/landing/Landing'
import { Login } from '@/features/auth/Login'
import { Register } from '@/features/auth/Register'
import { ForgotPassword } from '@/features/auth/ForgotPassword'
import { ResetPassword } from '@/features/auth/ResetPassword'
import { VerifyEmail } from '@/features/auth/VerifyEmail'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { MeterRechargeFlow } from '@/features/recharge/MeterRechargeFlow'
import { RechargeHistory } from '@/features/recharge/RechargeHistory'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken)
  const isRestoring = useAuthStore((s) => s.isRestoring)
  // While the session is being restored from the cookie, don't redirect
  if (isRestoring) return null
  if (!token) return <Navigate to="/" replace />
  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken)
  const isRestoring = useAuthStore((s) => s.isRestoring)
  if (isRestoring) return null
  if (token) return <Navigate to="/dashboard" replace />
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
          <Route path="/recharge" element={<ProtectedRoute><MeterRechargeFlow /></ProtectedRoute>} />
          <Route path="/recharge/history" element={<ProtectedRoute><RechargeHistory /></ProtectedRoute>} />
        </Route>
        <Route path="/welcome" element={<Navigate to="/" replace />} />
        <Route path="*" element={<AuthRedirect />} />
      </Routes>
    </Toaster>
  )
}

function AuthRedirect() {
  const token = useAuthStore((s) => s.accessToken)
  const isRestoring = useAuthStore((s) => s.isRestoring)
  if (isRestoring) return null
  return <Navigate to={token ? '/dashboard' : '/'} replace />
}

function LandingOrRedirect() {
  const token = useAuthStore((s) => s.accessToken)
  const isRestoring = useAuthStore((s) => s.isRestoring)
  if (isRestoring) return null
  if (token) return <Navigate to="/dashboard" replace />
  return <Landing />
}

// 