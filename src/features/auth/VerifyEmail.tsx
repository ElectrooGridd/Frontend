import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/Button'
import { AlertBadge } from '@/components/AlertBadge'
import { authService } from '@/services/authService'

export function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''

  // If we have a token, verify it. Otherwise show "check your email" state.
  if (token) return <TokenVerification token={token} />
  if (email) return <CheckYourEmail email={email} />

  return (
    <div className="animate-fade-in-up text-center">
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] border border-slate-100 p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Verify your email</h2>
        <AlertBadge variant="danger" message="Invalid or missing verification link" />
        <Link to="/login" className="block mt-6">
          <Button fullWidth variant="secondary" size="lg">Back to sign in</Button>
        </Link>
      </div>
    </div>
  )
}

/* ───── "Check your email" state (after registration) ───── */

function CheckYourEmail({ email }: { email: string }) {
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState('')

  const handleResend = async () => {
    setResending(true)
    setError('')
    try {
      await authService.requestEmailVerification(email)
      setResent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="animate-fade-in-up text-center">
      {/* Email icon */}
      <div className="mb-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-teal-50 to-emerald-100 flex items-center justify-center shadow-sm">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-teal-600">
            <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 7l8.165 5.715a3 3 0 0 0 3.67 0L22 7" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] border border-slate-100 p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h2>
        <p className="text-slate-500 text-[15px] mb-1">
          We've sent a verification link to
        </p>
        <p className="text-slate-800 font-semibold text-[15px] mb-6">{email}</p>

        <div className="bg-slate-50 rounded-xl p-4 mb-6">
          <p className="text-slate-500 text-sm leading-relaxed">
            Click the link in the email to verify your account, then come back here to sign in.
          </p>
        </div>

        {error && (
          <div className="mb-4 animate-scale-in">
            <AlertBadge variant="danger" message={error} />
          </div>
        )}

        {resent ? (
          <div className="mb-4 animate-scale-in">
            <AlertBadge variant="success" message="Verification email resent! Check your inbox." />
          </div>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors disabled:opacity-50 mb-6"
          >
            {resending ? 'Sending...' : "Didn't receive it? Resend email"}
          </button>
        )}

        <Link to="/login" className="block mt-4">
          <Button fullWidth variant="secondary" size="lg">
            Back to sign in
          </Button>
        </Link>
      </div>
    </div>
  )
}

/* ───── Token verification (from email link) ───── */

function TokenVerification({ token }: { token: string }) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
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

  if (status === 'success') {
    return (
      <div className="animate-fade-in-up text-center">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center shadow-sm">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="16" stroke="#22C55E" strokeWidth="2" opacity="0.3" />
              <path d="M13 20l5 5 9-9" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] border border-slate-100 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Email verified!</h2>
          <p className="text-slate-500 text-[15px] mb-6">{message}</p>
          <Link to="/login">
            <Button fullWidth size="lg">Continue to sign in</Button>
          </Link>
        </div>
      </div>
    )
  }

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
          <Button fullWidth variant="secondary" size="lg">Back to sign in</Button>
        </Link>
      </div>
    </div>
  )
}
