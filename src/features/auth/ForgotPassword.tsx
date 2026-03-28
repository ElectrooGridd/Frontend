import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { AlertBadge } from '@/components/AlertBadge'
import { authService } from '@/services/authService'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    setLoading(true)
    try {
      await authService.forgotPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="animate-fade-in-up text-center">
        {/* Success illustration */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-teal-50 to-emerald-100 flex items-center justify-center shadow-sm">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-teal-600">
              <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 7l8.165 5.715a3 3 0 0 0 3.67 0L22 7" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] border border-slate-100 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h2>
          <p className="text-slate-500 text-[15px] mb-6 leading-relaxed">
            If an account exists for <span className="font-medium text-slate-700">{email}</span>, we&apos;ve sent a password reset link.
          </p>
          <Link to="/login">
            <Button variant="secondary" fullWidth size="lg">
              Back to sign in
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-sm text-slate-400">
          Didn&apos;t receive an email? Check your spam folder.
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in-up">
      {/* Icon */}
      <div className="mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-100 flex items-center justify-center shadow-sm">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-teal-600">
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1.5" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Reset password
        </h1>
        <p className="mt-2 text-slate-500 text-[15px]">
          Enter your email and we&apos;ll send you a link to get back in.
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
          <Input
            type="email"
            label="Email address"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={loading}
          />
          <Button type="submit" fullWidth loading={loading} disabled={loading} size="lg">
            Send reset link
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
