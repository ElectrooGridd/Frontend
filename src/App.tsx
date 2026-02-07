import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ToastNotification'
import { useAuthStore } from '@/store/authStore'
import { AuthLayout } from '@/layouts/AuthLayout'
import { MainLayout } from '@/layouts/MainLayout'
import { Welcome } from '@/features/auth/Welcome'
import { Login } from '@/features/auth/Login'
import { Register } from '@/features/auth/Register'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { MeterRechargeFlow } from '@/features/recharge/MeterRechargeFlow'
import { RechargeHistory } from '@/features/recharge/RechargeHistory'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken)
  if (!token) return <Navigate to="/welcome" replace />
  return <>{children}</>
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken)
  if (token) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Toaster>
      <Routes>
        <Route path="/welcome" element={<PublicOnlyRoute><Welcome /></PublicOnlyRoute>} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
        </Route>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/recharge" element={<ProtectedRoute><MeterRechargeFlow /></ProtectedRoute>} />
          <Route path="/recharge/history" element={<ProtectedRoute><RechargeHistory /></ProtectedRoute>} />
        </Route>
        <Route path="/" element={<AuthRedirect />} />
        <Route path="*" element={<AuthRedirect />} />
      </Routes>
    </Toaster>
  )
}

function AuthRedirect() {
  const token = useAuthStore((s) => s.accessToken)
  return <Navigate to={token ? '/dashboard' : '/welcome'} replace />
}
