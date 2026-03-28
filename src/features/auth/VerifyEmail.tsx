import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/Button'
import { AlertBadge } from '@/components/AlertBadge'
import { authService } from '@/services/authService'

export function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid or missing verification token')
      return
    }
    authService
      .verifyEmailWithToken(token)
      .then((res) => {
        setStatus('success')
        setMessage(res.message ?? 'Email verified successfully')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Verification failed')
      })
  }, [token])

  // Loading state
  if (status === 'loading') {
    return (
      <div className="animate-fade-in text-center py-12">
        <div className="w-20 h-20 mx-auto mb-6 relative">
          <div className="absolute inset-0 rounded-full border-[3px] border-slate-100" />
          <div className="absolute inset-0 rounded-full border-[3px] border-teal-500 border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-teal-600">
              <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 7l8.165 5.715a3 3 0 0 0 3.67 0L22 7" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Verifying your email</h2>
        <p className="text-slate-500 text-sm">Please wait a moment...</p>
      </div>
    )
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="animate-fade-in-up text-center">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center shadow-sm">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="16" stroke="#22C55E" strokeWidth="2" opacity="0.3" />
              <path d="M13 20l5 5 9-9" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-check-draw" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] border border-slate-100 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Email verified</h2>
          <p className="text-slate-500 text-[15px] mb-6">{message}</p>
          <Link to="/login">
            <Button fullWidth size="lg">
              Continue to sign in
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Error state
  return (
    <div className="animate-fade-in-up text-center">
      <div className="mb-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center shadow-sm">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-red-500">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] border border-slate-100 p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Verification failed</h2>
        <div className="mb-6">
          <AlertBadge variant="danger" message={message} />
        </div>
        <Link to="/login">
          <Button fullWidth variant="secondary" size="lg">
            Back to sign in
          </Button>
        </Link>
      </div>
    </div>
  )
}
