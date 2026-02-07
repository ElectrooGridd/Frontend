import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Card } from '@/components/Card'
import { AlertBadge } from '@/components/AlertBadge'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'

export function Register() {
  const navigate = useNavigate()
  const setToken = useAuthStore((s) => s.setToken)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required')
      return
    }
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (!agreeTerms) {
      setError('Please agree to the terms and conditions')
      return
    }
    setLoading(true)
    try {
      const res = await authService.register({
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: email.trim(),
        password,
      })
      if (res.access_token) {
        setToken(res.access_token)
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <h2 className="text-2xl font-semibold text-text-primary mb-1">Get started with Electrogrid</h2>
      <p className="text-text-secondary text-sm mb-6">Create your account</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <AlertBadge variant="danger" message={error} />
        )}
        <Input
          type="text"
          label="First name"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          autoComplete="given-name"
          disabled={loading}
        />
        <Input
          type="text"
          label="Last name"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          autoComplete="family-name"
          disabled={loading}
        />
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
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          disabled={loading}
        />
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-text-secondary">
            I agree to the terms and conditions
          </span>
        </label>
        <Link to="/login" className="block text-sm text-primary font-medium hover:underline">
          Sign in as an agent
        </Link>
        <Button type="submit" fullWidth loading={loading} disabled={loading}>
          Continue with email
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-medium hover:underline">
          Log in
        </Link>
      </p>
    </Card>
  )
}
