import { useEffect, useState } from 'react'
import { waitlistService } from '@/services/waitlistService'
import { Events, trackEvent } from '@/services/analytics'

const DISCOS = [
  'Ikeja Electric (IKEDC)',
  'Eko Electricity (EKEDC)',
  'Abuja Disco (AEDC)',
  'Ibadan Disco (IBEDC)',
  'Port Harcourt Disco (PHED)',
  'Enugu Disco (EEDC)',
  'Kano Disco (KEDCO)',
  'Jos Disco (JED)',
  'Kaduna Disco (KAEDCO)',
  'Benin Disco (BEDC)',
  'Yola Disco (YEDC)',
]

type Props = {
  open: boolean
  onClose: () => void
  source?: string
  prefillMeter?: string
  prefillDisco?: string
}

export function WaitlistModal({ open, onClose, source, prefillMeter, prefillDisco }: Props) {
  const [email, setEmail] = useState('')
  const [disco, setDisco] = useState(prefillDisco ?? '')
  const [meter, setMeter] = useState(prefillMeter ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!open) return
    setDone(false)
    setError('')
    setEmail('')
    setDisco(prefillDisco ?? '')
    setMeter(prefillMeter ?? '')
  }, [open, prefillDisco, prefillMeter])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const trimmed = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email')
      return
    }
    setLoading(true)
    try {
      await waitlistService.submit({
        email: trimmed,
        disco: disco || undefined,
        meterNumber: meter.trim() || undefined,
        source,
      })
      trackEvent(Events.JoinWaitlist, { source: source ?? 'landing', disco: disco || '' })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="waitlist-title"
    >
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-auto border-2 border-teal-100 animate-scale-in">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {done ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-50 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 mb-2">You're on the list!</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              We'll email you the moment ElectroGrid goes live with your DISCO. No spam, promise.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-sm transition-all shadow-md shadow-teal-500/20"
            >
              Got it
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-7 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-100/60 border-2 border-teal-200/60 px-3 py-1 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
              </span>
              <span className="text-[10px] font-bold text-teal-700 tracking-wide uppercase">Early access</span>
            </div>
            <h2 id="waitlist-title" className="text-2xl font-extrabold text-slate-800 mb-1.5 tracking-tight">
              Join the waitlist
            </h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              We're onboarding DISCOs one by one. Drop your email and we'll let you know the moment recharge goes live for your provider.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 text-sm font-medium placeholder:text-slate-300 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Your DISCO <span className="text-slate-400 font-semibold normal-case">(optional)</span>
                </label>
                <select
                  value={disco}
                  onChange={(e) => setDisco(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 text-sm font-medium focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100 transition-all"
                >
                  <option value="">Pick your provider</option>
                  {DISCOS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-slate-400">Helps us prioritise which DISCO to onboard first.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Meter number <span className="text-slate-400 font-semibold normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={meter}
                  onChange={(e) => setMeter(e.target.value.replace(/[^0-9\s]/g, ''))}
                  placeholder="e.g. 45201234567"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 text-sm font-medium placeholder:text-slate-300 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100 transition-all"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-teal-500/20 mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding you…
                  </span>
                ) : (
                  'Join the waitlist'
                )}
              </button>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                We'll only email you about the launch. No marketing spam.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
