import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { AlertBadge } from '@/components/AlertBadge'
import { authService } from '@/services/authService'

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) setError('Invalid or missing reset token')
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!token) return
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await authService.resetPassword(token, password)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  // Success state
  if (success) {
    return (
      <div className="animate-fade-in-up text-center">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center shadow-sm">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="16" stroke="#22C55E" strokeWidth="2" opacity="0.3" />
              <circle cx="20" cy="20" r="16" stroke="#22C55E" strokeWidth="2" strokeDasharray="100" strokeDashoffset="0" className="animate-fade-in" />
              <path d="M13 20l5 5 9-9" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-check-draw" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] border border-slate-100 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Password updated</h2>
          <p className="text-slate-500 text-[15px] mb-6">
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
          <Button fullWidth size="lg" onClick={() => navigate('/login')}>
            Sign in
          </Button>
        </div>
      </div>
    )
  }

  // Missing token state
  if (!token) {
    return (
      <div className="animate-fade-in-up text-center">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center shadow-sm">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-red-500">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] border border-slate-100 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Invalid link</h2>
          <p className="text-slate-500 text-[15px] mb-6">
            This reset link is invalid or has expired. Please request a new one.
          </p>
          <Link to="/forgot-password">
            <Button fullWidth size="lg" variant="secondary">
              Request new link
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Form state
  return (
    <div className="animate-fade-in-up">
      {/* Icon */}
      <div className="mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-100 flex items-center justify-center shadow-sm">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-teal-600">
            <path d="M15.5 7.5l-1.342-1.342A2 2 0 0 0 12.744 5.5H8.5A2.5 2.5 0 0 0 6 8v8a2.5 2.5 0 0 0 2.5 2.5h7A2.5 2.5 0 0 0 18 16v-4.244a2 2 0 0 0-.659-1.414L15.5 7.5z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 12v4M12 12l2 2M12 12l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Set new password
        </h1>
        <p className="mt-2 text-slate-500 text-[15px]">
          Choose a strong password to secure your account.
        </p>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] border border-slate-100 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="animate-scale-in">
              <AlertBadge variant="danger" message={error} />
            </div>
          )}

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              label="New password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] p-1 text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          <Input
            type={showPassword ? 'text' : 'password'}
            label="Confirm password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            disabled={loading}
          />

          {/* Match indicator */}
          {confirmPassword && (
            <div className="flex items-center gap-2 animate-fade-in">
              {password === confirmPassword ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" fill="#22C55E" opacity="0.15" />
                    <path d="M5.5 8l2 2 3-3" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-xs font-medium text-emerald-600">Passwords match</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" fill="#EF4444" opacity="0.15" />
                    <path d="M6 6l4 4M10 6l-4 4" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span className="text-xs font-medium text-red-500">Passwords don&apos;t match</span>
                </>
              )}
            </div>
          )}

          <Button type="submit" fullWidth loading={loading} disabled={loading} size="lg">
            Reset password
          </Button>
        </form>
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        <Link to="/login" className="text-teal-600 font-semibold hover:text-teal-700 transition-colors inline-flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
