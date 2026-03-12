import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card } from '@/components/Card'
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

  return (
    <Card className="w-full">
      {status === 'loading' && (
        <div className="text-center py-8">
          <div className="inline-block w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-text-secondary">Verifying your email…</p>
        </div>
      )}
      {status === 'success' && (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4 text-success text-2xl">
            ✓
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Email verified</h2>
          <p className="text-text-secondary text-sm mb-6">{message}</p>
          <Link to="/login">
            <Button fullWidth>Log in</Button>
          </Link>
        </div>
      )}
      {status === 'error' && (
        <div className="space-y-4">
          <AlertBadge variant="danger" message={message} />
          <Link to="/login">
            <Button fullWidth variant="secondary">
              Back to login
            </Button>
          </Link>
        </div>
      )}
    </Card>
  )
}
