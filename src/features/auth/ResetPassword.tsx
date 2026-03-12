import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Card } from '@/components/Card'
import { AlertBadge } from '@/components/AlertBadge'
import { authService } from '@/services/authService'

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

  if (success) {
    return (
      <Card className="w-full">
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4 text-success text-2xl">
            ✓
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Password updated</h2>
          <p className="text-text-secondary text-sm mb-6">
            Your password has been reset. You can now log in.
          </p>
          <Button fullWidth onClick={() => navigate('/login')}>
            Log in
          </Button>
        </div>
      </Card>
    )
  }

  if (!token) {
    return (
      <Card className="w-full">
        <AlertBadge variant="danger" message="Invalid or missing reset token. Request a new link from the forgot password page." />
        <Link to="/forgot-password" className="block mt-4">
          <Button fullWidth variant="secondary">
            Request new link
          </Button>
        </Link>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <h2 className="text-xl font-semibold text-text-primary mb-1">Set new password</h2>
      <p className="text-text-secondary text-sm mb-6">
        Enter your new password below.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AlertBadge variant="danger" message={error} />}
        <Input
          type="password"
          label="New password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          disabled={loading}
        />
        <Input
          type="password"
          label="Confirm password"
          placeholder="Repeat password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          disabled={loading}
        />
        <Button type="submit" fullWidth loading={loading} disabled={loading}>
          Reset password
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
