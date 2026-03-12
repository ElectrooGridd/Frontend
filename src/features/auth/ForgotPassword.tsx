import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Card } from '@/components/Card'
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
      <Card className="w-full">
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4 text-success text-2xl">
            ✓
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Check your email</h2>
          <p className="text-text-secondary text-sm mb-6">
            If an account exists for {email}, we&apos;ve sent a password reset link.
          </p>
          <Link to="/login">
            <Button variant="secondary" fullWidth>
              Back to login
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <h2 className="text-xl font-semibold text-text-primary mb-1">Reset password</h2>
      <p className="text-text-secondary text-sm mb-6">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AlertBadge variant="danger" message={error} />}
        <Input
          type="email"
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          disabled={loading}
        />
        <Button type="submit" fullWidth loading={loading} disabled={loading}>
          Send reset link
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-text-secondary">
        <Link to="/login" className="text-primary font-medium hover:underline">
          ← Back to login
        </Link>
      </p>
    </Card>
  )
}
