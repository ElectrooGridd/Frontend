import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Card } from '@/components/Card'
import { AlertBadge } from '@/components/AlertBadge'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'

export function Login() {
  const navigate = useNavigate()
  const setToken = useAuthStore((s) => s.setToken)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    if (!password) {
      setError('Password is required')
      return
    }
    setLoading(true)
    try {
      const res = await authService.login({ email: email.trim(), password })
      if (res.access_token) {
        setToken(res.access_token)
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <h2 className="text-2xl font-semibold text-text-primary mb-1">Welcome back to Electrogrid</h2>
      <p className="text-text-secondary text-sm mb-6">Sign in to your account</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <AlertBadge variant="danger" message={error} />
        )}
        <Input
          type="email"
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          disabled={loading}
        />
        <Input
          type="password"
          label="Password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          disabled={loading}
        />
        <Link to="#" className="block text-sm text-primary font-medium hover:underline">
          Forgot password?
        </Link>
        <Button type="submit" fullWidth loading={loading} disabled={loading}>
          Log in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-text-secondary">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-primary font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </Card>
  )
}
