import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/Button'
import { SEO } from '@/components/SEO'
import { ScrollIndicator } from '@/components/ScrollIndicator'
import { WaitlistModal } from '@/components/WaitlistModal'
import { quickRechargeService, type QuickVerifyResponse } from '@/services/quickRechargeService'
import { Events, trackEvent } from '@/services/analytics'

/* ------------------------------------------------------------------ */
/*  Scroll-reveal hook                                                 */
/* ------------------------------------------------------------------ */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('is-visible'); observer.unobserve(el) } },
      { threshold: 0.12 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

/* ------------------------------------------------------------------ */
/*  Quick Recharge — Buy on the fly                                    */
/* ------------------------------------------------------------------ */
type QuickStep = 'meter' | 'confirm' | 'amount' | 'processing' | 'done'

type QuickRechargeProps = {
  onRequestWaitlist: (prefill: { meterNumber?: string; disco?: string }) => void
}

function QuickRecharge({ onRequestWaitlist }: QuickRechargeProps) {
  const [step, setStep] = useState<QuickStep>('meter')
  const [meterNumber, setMeterNumber] = useState('')
  const [meterDetails, setMeterDetails] = useState<QuickVerifyResponse | null>(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleVerify = async () => {
    setError('')
    const num = meterNumber.replace(/\s/g, '')
    trackEvent(Events.ClickVerifyMeter, { source: 'landing_quick_recharge' })
    if (!num || num.length < 6) {
      setError('Enter a valid meter number')
      return
    }
    setLoading(true)
    try {
      const res = await quickRechargeService.verifyMeter(num)
      setMeterDetails(res)
      trackEvent(Events.MeterVerificationSuccess, {
        source: 'landing_quick_recharge',
        disco: res.disco_name ?? '',
      })
      setStep('confirm')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not verify meter')
    } finally {
      setLoading(false)
    }
  }

  const handleRecharge = () => {
    setError('')
    const n = parseFloat(amount)
    if (isNaN(n) || n < 500) {
      setError('Minimum amount is ₦500')
      return
    }
    if (!meterDetails) return
    // DISCO integrations aren't live yet — collect interest via waitlist
    // instead of sending users into an auth flow that can't complete.
    onRequestWaitlist({
      meterNumber: meterDetails.meter_number,
      disco: meterDetails.disco_name,
    })
  }

  const reset = () => {
    setStep('meter')
    setMeterNumber('')
    setMeterDetails(null)
    setAmount('')
    setError('')
  }

  const presets = [500, 1000, 2000, 5000, 10000]

  return (
    <div className="w-full">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {(['meter', 'confirm', 'amount'] as const).map((s, i) => {
          const labels = ['Meter', 'Confirm', 'Pay']
          const stepOrder = { meter: 0, confirm: 1, amount: 2, processing: 2, done: 3 }
          const current = stepOrder[step]
          const isActive = i === current
          const isDone = i < current
          return (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className={`w-6 sm:w-10 h-0.5 rounded-full transition-colors duration-300 ${isDone ? 'bg-teal-400' : 'bg-slate-200'}`} />}
              <div className={`
                flex items-center gap-1.5 text-xs font-bold transition-all duration-300
                ${isActive ? 'text-teal-600' : isDone ? 'text-teal-500' : 'text-slate-300'}
              `}>
                <span className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-all duration-300
                  ${isActive ? 'bg-teal-500 text-white shadow-md shadow-teal-500/30' : isDone ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-400'}
                `}>
                  {isDone ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : i + 1}
                </span>
                <span className="hidden sm:inline">{labels[i]}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100 animate-scale-in">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Step: Enter meter */}
      {step === 'meter' && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Meter number</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                placeholder="e.g. 45201234567"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value.replace(/[^0-9\s]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 bg-white text-slate-900 text-base font-medium placeholder:text-slate-300 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100 transition-all disabled:opacity-50"
                disabled={loading}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="2" width="16" height="20" rx="3" />
                  <rect x="8" y="6" width="8" height="4" rx="1" />
                  <line x1="8" y1="14" x2="16" y2="14" />
                  <line x1="8" y1="18" x2="12" y2="18" />
                </svg>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleVerify}
            disabled={loading || !meterNumber.trim()}
            className="w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-teal-500/20 cartoon-btn"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </span>
            ) : (
              'Verify meter'
            )}
          </button>
        </div>
      )}

      {/* Step: Confirm meter details */}
      {step === 'confirm' && meterDetails && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="rounded-xl bg-teal-50/60 border border-teal-100 p-4 space-y-2.5">
            <div className="flex items-center gap-2 mb-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span className="text-sm font-bold text-teal-700">Meter found</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-slate-400 text-xs font-medium">Customer</p>
                <p className="font-semibold text-slate-800">{meterDetails.customer_name}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Meter</p>
                <p className="font-semibold text-slate-800">{meterDetails.meter_number}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Disco</p>
                <p className="font-semibold text-slate-800">{meterDetails.disco_name}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">Type</p>
                <p className="font-semibold text-slate-800 capitalize">{meterDetails.meter_type}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={reset}
              className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm transition-colors"
            >
              Wrong meter
            </button>
            <button
              type="button"
              onClick={() => { setError(''); setStep('amount') }}
              className="flex-1 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-sm transition-all shadow-md shadow-teal-500/20 cartoon-btn"
            >
              That's me — continue
            </button>
          </div>
        </div>
      )}

      {/* Step: Choose amount */}
      {step === 'amount' && (
        <div className="space-y-4 animate-fade-in-up">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">{'\u20A6'}</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="500"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleRecharge()}
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border-2 border-slate-200 bg-white text-slate-900 text-xl font-bold placeholder:text-slate-300 placeholder:font-medium focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-100 transition-all"
              />
            </div>
            {amount && parseFloat(amount) >= 500 && (
              <p className="mt-1.5 text-xs font-semibold text-teal-600 animate-fade-in">
                {'\u2248'} {(parseFloat(amount) / 25).toFixed(1)} kWh
              </p>
            )}
          </div>
          {/* Quick presets */}
          <div className="flex flex-wrap gap-2">
            {presets.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setAmount(String(n))}
                className={`
                  px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200
                  ${amount === String(n)
                    ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }
                `}
              >
                {'\u20A6'}{n.toLocaleString()}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setError(''); setStep('confirm') }}
              className="py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleRecharge}
              disabled={loading || !amount || parseFloat(amount) < 500}
              className="flex-1 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-teal-500/20 cartoon-btn"
            >
              {`Join waitlist · ${'\u20A6'}${amount ? parseFloat(amount).toLocaleString() : '0'}`}
            </button>
          </div>
          {/* Meter summary mini */}
          {meterDetails && (
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="3" />
                <rect x="8" y="6" width="8" height="4" rx="1" />
              </svg>
              <span>{meterDetails.customer_name} — {meterDetails.meter_number}</span>
              <button type="button" onClick={reset} className="text-teal-500 font-semibold hover:underline ml-auto">Change</button>
            </div>
          )}
        </div>
      )}

      {/* Step: Processing */}
      {step === 'processing' && (
        <div className="text-center py-8 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-[3px] border-teal-100" />
            <div className="absolute inset-0 rounded-full border-[3px] border-teal-500 border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-teal-600">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <p className="font-bold text-slate-800">Processing your recharge...</p>
          <p className="text-sm text-slate-400 mt-1">Redirecting to payment</p>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="text-center py-8 animate-fade-in-up">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-50 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <p className="font-bold text-slate-800 text-lg">Recharge submitted!</p>
          <p className="text-sm text-slate-400 mt-1 mb-6">Your meter will be credited shortly.</p>
          <button
            type="button"
            onClick={reset}
            className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-sm transition-all shadow-md shadow-teal-500/20 cartoon-btn"
          >
            Recharge another meter
          </button>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Animated counter                                                   */
/* ------------------------------------------------------------------ */
function AnimatedCounter({ target, suffix = '' }: { target: string; suffix?: string }) {
  const [display, setDisplay] = useState('0')
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const num = parseFloat(target.replace(/[^0-9.]/g, ''))
          const prefix = target.match(/^[^0-9]*/)?.[0] ?? ''
          const decimal = target.includes('.')
          const dur = 1600
          const t0 = performance.now()
          const tick = (now: number) => {
            const p = Math.min((now - t0) / dur, 1)
            const e = 1 - Math.pow(1 - p, 3)
            setDisplay(prefix + (decimal ? (num * e).toFixed(1) : Math.floor(num * e).toLocaleString()))
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.5 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target])
  return <span ref={ref}>{display}{suffix}</span>
}

/* ================================================================== */
/*  CARTOON SVG ILLUSTRATIONS                                          */
/* ================================================================== */

function HeroIllustration() {
  return (
    <svg viewBox="0 0 400 360" fill="none" className="w-full max-w-[400px]">
      {/* Background blob */}
      <ellipse cx="200" cy="190" rx="160" ry="150" className="fill-teal-100/60 animate-blob" />

      {/* Phone body */}
      <g className="animate-cartoon-float">
        <rect x="130" y="40" width="140" height="260" rx="24" fill="#1E293B" stroke="#0F172A" strokeWidth="3" />
        <rect x="140" y="56" width="120" height="228" rx="14" fill="white" />
        {/* Notch */}
        <rect x="175" y="44" width="50" height="6" rx="3" fill="#334155" />

        {/* Screen content */}
        {/* Header */}
        <rect x="150" y="68" width="100" height="8" rx="4" fill="#0d9488" opacity="0.3" />
        <text x="152" y="96" fontSize="9" fontWeight="700" fill="#0F172A" fontFamily="system-ui">Smart Recharge</text>

        {/* Balance card */}
        <rect x="150" y="106" width="100" height="60" rx="12" fill="url(#balGrad)" />
        <text x="160" y="126" fontSize="7" fill="white" opacity="0.8" fontFamily="system-ui">Balance</text>
        <text x="160" y="145" fontSize="16" fontWeight="800" fill="white" fontFamily="system-ui">{'\u20A6'}12,450</text>

        {/* Mini bars */}
        {[0,1,2,3,4,5,6].map((i) => {
          const h = [20, 32, 24, 38, 28, 34, 18][i]
          return (
            <rect
              key={i}
              x={156 + i * 13}
              y={220 - h}
              width="8"
              rx="4"
              height={h}
              fill={i === 3 ? '#0d9488' : '#99F6E4'}
              className="animate-bar-grow"
              style={{ animationDelay: `${0.8 + i * 0.1}s` }}
            />
          )
        })}
        <text x="152" y="178" fontSize="7" fontWeight="600" fill="#475569" fontFamily="system-ui">This week</text>

        {/* Bottom nav dots */}
        <circle cx="180" cy="268" r="4" fill="#0d9488" />
        <circle cx="200" cy="268" r="4" fill="#E2E8F0" />
        <circle cx="220" cy="268" r="4" fill="#E2E8F0" />
      </g>

      {/* Floating elements around phone */}
      {/* Lightning bolt */}
      <g className="animate-cartoon-float" style={{ animationDelay: '0.5s' }}>
        <circle cx="310" cy="80" r="26" fill="#FEF3C7" stroke="#FBBF24" strokeWidth="2" />
        <path d="M306 72 L302 82 H308 L304 92" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>

      {/* Checkmark bubble */}
      <g className="animate-cartoon-float" style={{ animationDelay: '1s' }}>
        <circle cx="90" cy="120" r="22" fill="#D1FAE5" stroke="#34D399" strokeWidth="2" />
        <path d="M80 120 L87 127 L100 113" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>

      {/* Coin */}
      <g className="animate-cartoon-float" style={{ animationDelay: '1.5s' }}>
        <circle cx="320" cy="220" r="20" fill="#FDE68A" stroke="#F59E0B" strokeWidth="2" />
        <text x="314" y="226" fontSize="16" fontWeight="800" fill="#B45309" fontFamily="system-ui">{'\u20A6'}</text>
      </g>

      {/* Wi-Fi waves */}
      <g className="animate-cartoon-float" style={{ animationDelay: '2s' }}>
        <circle cx="80" cy="240" r="18" fill="#E0E7FF" stroke="#818CF8" strokeWidth="2" />
        <path d="M72 244a12 12 0 0116 0" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M75 240a8 8 0 0110 0" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" fill="none" />
        <circle cx="80" cy="246" r="1.5" fill="#6366F1" />
      </g>

      {/* Sparkles */}
      <g opacity="0.7">
        <path d="M340 140 L342 146 L348 148 L342 150 L340 156 L338 150 L332 148 L338 146Z" fill="#FBBF24" className="animate-pop-in" style={{ animationDelay: '1.2s' }} />
        <path d="M60 80 L61.5 84 L65.5 85.5 L61.5 87 L60 91 L58.5 87 L54.5 85.5 L58.5 84Z" fill="#34D399" className="animate-pop-in" style={{ animationDelay: '1.8s' }} />
        <path d="M110 300 L111.5 304 L115.5 305.5 L111.5 307 L110 311 L108.5 307 L104.5 305.5 L108.5 304Z" fill="#818CF8" className="animate-pop-in" style={{ animationDelay: '2.2s' }} />
      </g>

      <defs>
        <linearGradient id="balGrad" x1="150" y1="106" x2="250" y2="166" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0d9488" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function StepIllustration({ step }: { step: '01' | '02' | '03' }) {
  if (step === '01') return (
    <svg viewBox="0 0 80 80" fill="none" className="w-16 h-16">
      <circle cx="40" cy="40" r="36" fill="#CCFBF1" />
      <rect x="24" y="22" width="32" height="36" rx="6" fill="white" stroke="#0d9488" strokeWidth="2" />
      <rect x="30" y="30" width="20" height="4" rx="2" fill="#99F6E4" />
      <rect x="30" y="38" width="14" height="4" rx="2" fill="#5EEAD4" />
      <circle cx="52" cy="52" r="12" fill="#F0FDFA" stroke="#0d9488" strokeWidth="2" />
      <path d="M48 52h8M52 48v8" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
  if (step === '02') return (
    <svg viewBox="0 0 80 80" fill="none" className="w-16 h-16">
      <circle cx="40" cy="40" r="36" fill="#FEF3C7" />
      <circle cx="40" cy="38" r="18" fill="white" stroke="#F59E0B" strokeWidth="2" />
      <text x="30" y="44" fontSize="18" fontWeight="800" fill="#B45309" fontFamily="system-ui">{'\u20A6'}</text>
      <rect x="26" y="58" width="28" height="6" rx="3" fill="#FDE68A" />
    </svg>
  )
  return (
    <svg viewBox="0 0 80 80" fill="none" className="w-16 h-16">
      <circle cx="40" cy="40" r="36" fill="#CCFBF1" />
      <path d="M30 26 L26 40 H34 L28 56" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="#FEF3C7" />
      <path d="M44 26 L40 40 H48 L42 56" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="#CCFBF1" />
      <circle cx="54" cy="54" r="12" fill="white" stroke="#059669" strokeWidth="2" />
      <path d="M48 54 L52 58 L60 50" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FeatureIllustration({ type }: { type: string }) {
  const illustrations: Record<string, JSX.Element> = {
    verify: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <circle cx="24" cy="24" r="22" fill="#CCFBF1" />
        <path d="M16 24l5 5 11-11" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    wireless: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <circle cx="24" cy="24" r="22" fill="#E0E7FF" />
        <path d="M14 30a14 14 0 0120 0" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M18 34a8 8 0 0112 0" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="24" cy="37" r="2" fill="#6366F1" />
      </svg>
    ),
    analytics: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <circle cx="24" cy="24" r="22" fill="#F3E8FF" />
        <rect x="12" y="28" width="6" height="10" rx="2" fill="#C084FC" />
        <rect x="21" y="20" width="6" height="18" rx="2" fill="#A855F7" />
        <rect x="30" y="14" width="6" height="24" rx="2" fill="#7C3AED" />
      </svg>
    ),
    security: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <circle cx="24" cy="24" r="22" fill="#FEF3C7" />
        <rect x="16" y="22" width="16" height="14" rx="3" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1.5" />
        <path d="M20 22v-4a4 4 0 018 0v4" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        <circle cx="24" cy="29" r="2" fill="#92400E" />
      </svg>
    ),
    history: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <circle cx="24" cy="24" r="22" fill="#FFE4E6" />
        <circle cx="24" cy="24" r="12" stroke="#F43F5E" strokeWidth="2.5" fill="white" />
        <path d="M24 18v6l4 4" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    alerts: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <circle cx="24" cy="24" r="22" fill="#CCFBF1" />
        <path d="M24 12c-5.5 0-10 4-10 9v7l-2 3h24l-2-3v-7c0-5-4.5-9-10-9z" fill="#5EEAD4" stroke="#0d9488" strokeWidth="1.5" />
        <path d="M20 33a4 4 0 008 0" stroke="#0d9488" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="34" cy="14" r="5" fill="#EF4444" />
        <text x="32" y="17" fontSize="8" fontWeight="700" fill="white" fontFamily="system-ui">3</text>
      </svg>
    ),
  }
  return illustrations[type] ?? null
}

/* ================================================================== */
/*  LANDING PAGE                                                       */
/* ================================================================== */
export function Landing() {
  useEffect(() => {
    trackEvent(Events.LandingPageView, { variant: 'home' })
  }, [])
  const heroRef = useReveal<HTMLDivElement>()
  const stepsHeaderRef = useReveal<HTMLDivElement>()
  const featuresHeaderRef = useReveal<HTMLDivElement>()
  const showcaseRef = useReveal<HTMLDivElement>()
  const testimonialsHeaderRef = useReveal<HTMLDivElement>()
  const faqHeaderRef = useReveal<HTMLDivElement>()
  const ctaRef = useReveal<HTMLDivElement>()

  const [waitlistOpen, setWaitlistOpen] = useState(false)
  const [waitlistSource, setWaitlistSource] = useState<string>('landing_generic')
  const [waitlistPrefill, setWaitlistPrefill] = useState<{ meterNumber?: string; disco?: string }>({})

  const openWaitlist = (source: string, prefill: { meterNumber?: string; disco?: string } = {}) => {
    setWaitlistSource(source)
    setWaitlistPrefill(prefill)
    setWaitlistOpen(true)
  }

  return (
    <>
    <SEO
      title="ElectroGrid – Prepaid Meter Recharge & Electricity Tokens in Nigeria"
      description="Recharge any prepaid electricity meter in Nigeria in seconds. Buy DISCO tokens instantly, track usage, and manage multiple meters from one dashboard."
      path="/"
    />
    <div className="min-h-screen flex flex-col bg-[#FAFDF9] overflow-x-hidden" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      <ScrollIndicator />

      {/* ───────────── NAVBAR ───────────── */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#FAFDF9]/85 border-b border-teal-100/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/images/logo.png" alt="ElectroGrid" className="w-12 h-12 object-contain cartoon-btn logo-teal" />
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-500">
            <a href="#quick-recharge" className="hover:text-teal-600 transition-colors">Quick recharge</a>
            <a href="#how-it-works" className="hover:text-teal-600 transition-colors">How it works</a>
            <a href="#features" className="hover:text-teal-600 transition-colors">Features</a>
            <a href="#faq" className="hover:text-teal-600 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => openWaitlist('landing_nav')}
              className="bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-xl shadow-md shadow-teal-500/20 cartoon-btn border-0"
            >
              Join waitlist
            </Button>
          </div>
        </div>
      </nav>

      {/* ───────────── HERO ───────────── */}
      <section className="relative overflow-hidden">
        {/* Playful background */}
        <div className="absolute inset-0 bg-gradient-to-b from-teal-50/80 via-[#FAFDF9] to-[#FAFDF9]" />
        {/* Cartoon blobs */}
        <div className="absolute top-10 right-[5%] w-80 h-80 bg-yellow-200/30 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-32 left-[2%] w-60 h-60 bg-teal-200/25 rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-10 right-[15%] w-40 h-40 bg-violet-200/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #0d9488 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }} />

        <div ref={heroRef} className="reveal relative max-w-6xl mx-auto px-6 pt-16 pb-16 sm:pt-24 sm:pb-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-6 items-center">
            {/* Left: copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-100/60 border-2 border-teal-200/60 px-4 py-2 mb-8 cartoon-btn cursor-default">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500" />
                </span>
                <span className="text-xs font-bold text-teal-700 tracking-wide">Trusted by 50,000+ Nigerians</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-slate-800 tracking-tight leading-[1.08] mb-6">
                Buy electricity<br />
                <span className="bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-500 bg-clip-text text-transparent animate-gradient-text bg-[length:200%_auto]">
                  like magic
                </span>{' '}
                <span className="inline-block animate-cartoon-float" style={{ animationDuration: '3s' }}>
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 inline -mt-2" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="20" fill="#FEF3C7"/><path d="M22 14l-4 12h8l-6 12" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-500 max-w-xl mb-10 leading-relaxed lg:mx-0 mx-auto">
                Verify your meter, top up instantly, and track your usage. No queues, no agents, no wahala.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  onClick={() => openWaitlist('landing_hero')}
                  className="w-full sm:w-auto bg-teal-500 hover:bg-teal-400 text-white px-8 py-4 text-base font-bold rounded-2xl shadow-lg shadow-teal-500/25 cartoon-btn border-0"
                >
                  Join the waitlist
                </Button>
                <a
                  href="#quick-recharge"
                  className="w-full sm:w-auto inline-flex items-center justify-center bg-white hover:bg-teal-50 text-slate-700 border-2 border-slate-200 hover:border-teal-200 px-8 py-4 text-base font-bold rounded-2xl shadow-sm cartoon-btn transition-colors"
                >
                  See how it works
                </a>
              </div>

              {/* Trust badges */}
              <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-slate-400">
                {['Instant delivery', 'All discos', 'No hidden fees', '24/7'].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center">
                      <svg className="w-3 h-3 text-teal-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </span>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: illustration */}
            <div className="flex justify-center lg:justify-end">
              <HeroIllustration />
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <a
          href="#quick-recharge"
          aria-label="Scroll to next section"
          className="group absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-slate-500 hover:text-teal-600 transition-colors"
        >
          <span className="text-[11px] font-bold uppercase tracking-[0.18em]">Scroll</span>
          <div className="w-7 h-11 rounded-full border-2 border-slate-400 group-hover:border-teal-500 flex items-start justify-center pt-2 transition-colors">
            <div className="w-1.5 h-2.5 rounded-full bg-slate-400 group-hover:bg-teal-500 animate-[gentleBounce_1.5s_ease-in-out_infinite] transition-colors" />
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-gentle-bounce -mt-0.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </a>
      </section>

      {/* ───────────── BUY ON THE FLY ───────────── */}
      <section id="quick-recharge" className="py-16 sm:py-24 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-teal-50/30 to-white" />
        <div className="absolute top-10 left-[5%] w-72 h-72 bg-teal-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-[8%] w-56 h-56 bg-amber-200/15 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left — copy */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100/60 border-2 border-amber-200/50 px-4 py-2 mb-6">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                <span className="text-xs font-bold text-amber-700 tracking-wide">Instant recharge — no account needed</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight mb-4">
                Buy on the fly
              </h2>
              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-md">
                In a rush? Just enter your meter number, pick an amount, pay, and your meter is credited instantly. No sign-up, no hassle.
              </p>
              <div className="flex flex-col gap-4">
                {[
                  { icon: '1', text: 'Enter your prepaid meter number' },
                  { icon: '2', text: 'Confirm it\'s the right meter' },
                  { icon: '3', text: 'Choose amount, pay, done!' },
                ].map((item) => (
                  <div key={item.icon} className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-extrabold flex-shrink-0">
                      {item.icon}
                    </span>
                    <span className="text-sm text-slate-600 font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Secure payment
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  Instant delivery
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  All discos
                </span>
              </div>
            </div>

            {/* Right — recharge widget */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-[0_8px_40px_-8px_rgba(0,0,0,0.1)] border border-slate-100 p-6 sm:p-8">
                <div className="flex items-center gap-2.5 mb-6">
                  <img src="/images/logo.png" alt="ElectroGrid" className="w-10 h-10 object-contain logo-teal" />
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Quick Recharge</h3>
                    <p className="text-xs text-slate-400">No account required</p>
                  </div>
                </div>
                <QuickRecharge
                  onRequestWaitlist={(prefill) => openWaitlist('landing_quick_recharge', prefill)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── DISCO MARQUEE ───────────── */}
      <section className="py-8 border-y border-teal-100/50 bg-white/60 overflow-hidden">
        <p className="text-center text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-5">Works with all distribution companies</p>
        <div className="relative">
          <div className="flex gap-10 animate-[marquee_30s_linear_infinite] whitespace-nowrap">
            {[...discos, ...discos].map((name, i) => (
              <span key={i} className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-teal-500 transition-colors cursor-default select-none px-2">
                <span className="w-2 h-2 rounded-full bg-teal-300/50" />
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── HOW IT WORKS ───────────── */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div ref={stepsHeaderRef} className="reveal text-center mb-16">
            <span className="inline-block bg-teal-100 text-teal-700 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">How it works</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
              Three easy steps
            </h2>
            <p className="mt-4 text-slate-500 max-w-md mx-auto">No long forms. No waiting in line. Just power in your pocket.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 sm:gap-6">
            {steps.map((s, i) => (
              <StepCardComponent key={s.step} {...s} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── WHY ELECTROGRID (showcase) ───────────── */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-teal-50/50 to-white border-y border-teal-100/30">
        <div ref={showcaseRef} className="reveal max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Left: big illustration */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute -inset-10 bg-gradient-to-br from-yellow-100/40 to-teal-100/40 rounded-full blur-3xl animate-blob" />
                <svg viewBox="0 0 360 360" fill="none" className="relative w-full max-w-[340px]">
                  {/* Big meter */}
                  <circle cx="180" cy="180" r="140" fill="white" stroke="#E2E8F0" strokeWidth="3" />
                  <circle cx="180" cy="180" r="120" fill="#F0FDFA" stroke="#99F6E4" strokeWidth="2" strokeDasharray="8 4" />

                  {/* Gauge arc */}
                  <path d="M90 220 A100 100 0 0 1 270 220" stroke="#E2E8F0" strokeWidth="12" strokeLinecap="round" fill="none" />
                  <path d="M90 220 A100 100 0 0 1 240 140" stroke="url(#gaugeGrad)" strokeWidth="12" strokeLinecap="round" fill="none" className="animate-arc-fill" />

                  {/* Center display */}
                  <rect x="140" y="160" width="80" height="44" rx="10" fill="white" stroke="#0d9488" strokeWidth="2" />
                  <text x="152" y="172" fontSize="8" fill="#64748B" fontFamily="system-ui">kWh used</text>
                  <text x="152" y="194" fontSize="20" fontWeight="800" fill="#0F172A" fontFamily="system-ui">247.5</text>

                  {/* Character: happy person */}
                  <g transform="translate(260, 80)">
                    {/* Body */}
                    <circle cx="0" cy="0" r="22" fill="#FEF3C7" stroke="#FBBF24" strokeWidth="2" />
                    {/* Face */}
                    <circle cx="-6" cy="-4" r="2" fill="#1E293B" />
                    <circle cx="6" cy="-4" r="2" fill="#1E293B" />
                    <path d="M-5 4 Q0 10 5 4" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                    {/* Phone in hand */}
                    <rect x="18" y="-6" width="12" height="20" rx="3" fill="#1E293B" />
                    <rect x="19.5" y="-3" width="9" height="14" rx="1.5" fill="#5EEAD4" />
                  </g>

                  {/* Floating coins */}
                  <g className="animate-cartoon-float" style={{ animationDelay: '0.3s' }}>
                    <circle cx="70" cy="100" r="16" fill="#FDE68A" stroke="#F59E0B" strokeWidth="2" />
                    <text x="63" y="106" fontSize="14" fontWeight="800" fill="#B45309" fontFamily="system-ui">{'\u20A6'}</text>
                  </g>
                  <g className="animate-cartoon-float" style={{ animationDelay: '1.2s' }}>
                    <circle cx="290" cy="260" r="12" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.5" />
                    <text x="285" y="265" fontSize="10" fontWeight="800" fill="#B45309" fontFamily="system-ui">{'\u20A6'}</text>
                  </g>

                  {/* Sparkles */}
                  <path d="M310 160 L312 166 L318 168 L312 170 L310 176 L308 170 L302 168 L308 166Z" fill="#0d9488" opacity="0.5" className="animate-pop-in" style={{ animationDelay: '1.5s' }} />
                  <path d="M50 260 L51.5 264 L55.5 265.5 L51.5 267 L50 271 L48.5 267 L44.5 265.5 L48.5 264Z" fill="#FBBF24" opacity="0.5" className="animate-pop-in" style={{ animationDelay: '2s' }} />

                  <defs>
                    <linearGradient id="gaugeGrad" x1="90" y1="220" x2="240" y2="140" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#5EEAD4" />
                      <stop offset="1" stopColor="#0d9488" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Right: text + value props */}
            <div>
              <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">Why ElectroGrid</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight mb-8 leading-tight">
                The fastest way to buy electricity in Nigeria
              </h2>
              <div className="space-y-6">
                {whyItems.map((item) => (
                  <div key={item.title} className="flex gap-4 group cursor-default cartoon-icon-hover">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-teal-50 border-2 border-teal-100 text-teal-600 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white group-hover:border-teal-500 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-teal-500/20">
                      <div className="icon-inner">{item.icon}</div>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 mb-0.5">{item.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Button
                  size="lg"
                  onClick={() => openWaitlist('landing_why')}
                  className="bg-teal-500 hover:bg-teal-400 text-white px-8 py-3.5 font-bold rounded-2xl shadow-md shadow-teal-500/20 cartoon-btn border-0"
                >
                  Join the waitlist
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── FEATURES ───────────── */}
      <section id="features" className="py-20 sm:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div ref={featuresHeaderRef} className="reveal text-center mb-16">
            <span className="inline-block bg-violet-100 text-violet-700 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">Features</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
              Everything you need, nothing you don't
            </h2>
            <p className="mt-4 text-slate-500 max-w-lg mx-auto">
              Built for the way Nigerians buy electricity. Fast, reliable, and always available.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <FeatureCardComponent key={f.title} {...f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── STATS ───────────── */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800">
        {/* Playful bg shapes */}
        <div className="absolute top-0 left-[10%] w-64 h-64 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-[10%] w-72 h-72 bg-emerald-500/8 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block bg-white/10 text-teal-300 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4 backdrop-blur-sm">By the numbers</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Real impact, measured daily</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { target: '50000', suffix: '+', label: 'Happy users', emoji: <svg viewBox="0 0 32 32" className="w-8 h-8"><circle cx="16" cy="16" r="14" fill="#FEF3C7"/><circle cx="11" cy="13" r="2" fill="#1E293B"/><circle cx="21" cy="13" r="2" fill="#1E293B"/><path d="M10 20 Q16 26 22 20" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none"/></svg> },
              { target: '1.2', suffix: 'M+', label: 'Recharges made', emoji: <svg viewBox="0 0 32 32" className="w-8 h-8"><circle cx="16" cy="16" r="14" fill="#D1FAE5"/><path d="M12 10l-2 8h6l-4 8" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
              { target: '99.9', suffix: '%', label: 'Platform uptime', emoji: <svg viewBox="0 0 32 32" className="w-8 h-8"><circle cx="16" cy="16" r="14" fill="#E0E7FF"/><path d="M10 16l4 4 8-8" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
              { target: '5', suffix: 's', label: 'Avg. delivery', emoji: <svg viewBox="0 0 32 32" className="w-8 h-8"><circle cx="16" cy="16" r="14" fill="#FEF3C7"/><circle cx="16" cy="16" r="8" stroke="#F59E0B" strokeWidth="2" fill="none"/><path d="M16 12v4l3 3" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/></svg> },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-6 text-center cartoon-card">
                <div className="flex justify-center mb-3">{s.emoji}</div>
                <p className="text-3xl sm:text-4xl font-extrabold text-white mb-1">
                  <AnimatedCounter target={s.target} suffix={s.suffix} />
                </p>
                <p className="text-sm text-slate-400 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── TESTIMONIALS ───────────── */}
      <section id="testimonials" className="py-20 sm:py-28 bg-[#FAFDF9]">
        <div className="max-w-5xl mx-auto px-6">
          <div ref={testimonialsHeaderRef} className="reveal text-center mb-16">
            <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">Reviews</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
              Loved by thousands
            </h2>
            <p className="mt-4 text-slate-500">Don't take our word for it — hear from real users.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <TestimonialCard key={i} {...t} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section id="faq" className="py-20 sm:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div ref={faqHeaderRef} className="reveal text-center mb-14">
            <span className="inline-block bg-teal-100 text-teal-700 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">FAQ</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
              Got questions?
            </h2>
            <p className="mt-3 text-slate-500">We've got answers. If you don't see yours, reach out to support.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FaqItem key={i} {...faq} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── CTA ───────────── */}
      <section className="py-20 sm:py-24 bg-[#FAFDF9]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div ref={ctaRef} className="reveal-scale rounded-[2rem] bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-600 px-8 py-14 sm:px-16 sm:py-20 relative overflow-hidden shadow-2xl shadow-teal-500/20">
            {/* Decorative shapes */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-300/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />

            {/* Floating cartoon elements */}
            <div className="absolute top-8 left-8 animate-cartoon-float" style={{ animationDelay: '0.5s' }}>
              <svg viewBox="0 0 40 40" className="w-10 h-10 opacity-30"><circle cx="20" cy="20" r="16" fill="white"/><path d="M16 14l-2 8h6l-4 8" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="absolute bottom-8 right-10 animate-cartoon-float" style={{ animationDelay: '1.5s' }}>
              <svg viewBox="0 0 32 32" className="w-8 h-8 opacity-30"><circle cx="16" cy="16" r="14" fill="white"/><text x="9" y="22" fontSize="16" fontWeight="800" fill="#0d9488" fontFamily="system-ui">{'\u20A6'}</text></svg>
            </div>

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
                Be first in line
              </h2>
              <p className="text-teal-100 mb-8 max-w-md mx-auto leading-relaxed text-lg">
                We're rolling out DISCO by DISCO. Join the waitlist and we'll email you the second recharge goes live for your provider.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => openWaitlist('landing_final_cta')}
                  className="w-full sm:w-auto !bg-white hover:!bg-slate-50 !text-teal-700 px-10 py-4 text-base font-extrabold rounded-2xl shadow-lg cartoon-btn border-0"
                >
                  Join the waitlist
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── FOOTER ───────────── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="mb-4">
                <img src="/images/logo.png" alt="ElectroGrid" className="w-11 h-11 object-contain logo-teal" />
              </div>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                Smart electricity recharge for modern Nigeria. Fast, secure, and always on.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><a href="#how-it-works" className="hover:text-teal-600 transition-colors">How it works</a></li>
                <li><a href="#features" className="hover:text-teal-600 transition-colors">Features</a></li>
                <li><a href="#faq" className="hover:text-teal-600 transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">Get access</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li>
                  <button
                    type="button"
                    onClick={() => openWaitlist('landing_footer')}
                    className="hover:text-teal-600 transition-colors text-left"
                  >
                    Join the waitlist
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">Support</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><a href="#faq" className="hover:text-teal-600 transition-colors">Help center</a></li>
                <li><span className="text-slate-400">support@electrogrid.ng</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400">&copy; {new Date().getFullYear()} ElectroGrid. All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span>Terms of Service</span>
              <span>Privacy Policy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
    <WaitlistModal
      open={waitlistOpen}
      onClose={() => setWaitlistOpen(false)}
      source={waitlistSource}
      prefillMeter={waitlistPrefill.meterNumber}
      prefillDisco={waitlistPrefill.disco}
    />
    </>
  )
}

/* ================================================================== */
/*  DATA                                                               */
/* ================================================================== */

const discos = [
  'Ikeja Electric', 'Eko Electricity', 'Ibadan Disco', 'Abuja Disco',
  'Enugu Disco', 'Port Harcourt Disco', 'Jos Disco', 'Kaduna Disco',
  'Kano Disco', 'Benin Disco', 'Yola Disco',
]

const steps: { step: '01' | '02' | '03'; title: string; description: string }[] = [
  { step: '01', title: 'Enter meter number', description: 'Type in your prepaid or postpaid meter number and we verify it instantly against your disco.' },
  { step: '02', title: 'Choose amount', description: 'Pick any amount that works — from as low as \u20A6500 up to \u20A6100,000.' },
  { step: '03', title: 'Get your token', description: 'Pay securely and your meter is credited automatically. Done!' },
]

const features = [
  { title: 'Instant verification', description: 'Confirm meter ownership and details in real time before you pay a single naira.', type: 'verify' },
  { title: 'Wireless top-up', description: 'Credit goes straight to your meter. No physical token card needed.', type: 'wireless' },
  { title: 'Usage analytics', description: 'Daily and weekly consumption charts so you know exactly where your energy goes.', type: 'analytics' },
  { title: 'Bank-grade security', description: 'End-to-end encryption on every transaction. Your money and data are safe.', type: 'security' },
  { title: 'Full history', description: 'Every recharge logged and searchable. Download receipts for your records.', type: 'history' },
  { title: 'Smart alerts', description: 'Low balance warnings and outage notifications. Never caught in the dark.', type: 'alerts' },
]

const whyItems = [
  { title: 'Lightning-fast delivery', description: 'Average token delivery under 5 seconds. Most recharges complete before you blink.', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg> },
  { title: 'Every disco covered', description: 'All 11 distribution companies nationwide. Ikeja to Jos, we\'ve got you.', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg> },
  { title: 'Zero hidden charges', description: 'What you see is what you pay. No service fees, no surprise deductions.', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg> },
  { title: 'Available 24/7', description: 'Need power at 2am? We\'re always on. Recharge anytime, anywhere.', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
]

const testimonials = [
  { name: 'Adebayo O.', location: 'Lagos', text: 'I used to spend 30 minutes at the disco office just to buy light. Now I do it in under a minute from my bed. Game changer!', avatar: 'A' },
  { name: 'Chioma E.', location: 'Abuja', text: 'The usage tracking feature helps me budget my electricity. I know exactly how much I use daily now. Love it!', avatar: 'C' },
  { name: 'Ibrahim M.', location: 'Kano', text: 'Fast, reliable, and the token comes almost instantly. I\'ve recommended ElectroGrid to my entire family.', avatar: 'I' },
  { name: 'Funke A.', location: 'Ibadan', text: 'Recharged at midnight when NEPA took light. Token came in 3 seconds. Where has this been all my life?', avatar: 'F' },
  { name: 'Emeka N.', location: 'Port Harcourt', text: 'No more carrying cash to the agent. I just open the app, enter my meter, and done. So convenient.', avatar: 'E' },
  { name: 'Halima B.', location: 'Jos', text: 'The balance alerts are clutch. I get a notification before my units run out so I\'m never in the dark.', avatar: 'H' },
]

const faqs = [
  { question: 'How quickly will I receive my token?', answer: 'Most tokens arrive within 5 seconds. During high traffic, it may take up to 60 seconds.' },
  { question: 'Which distribution companies do you support?', answer: 'All 11 discos across Nigeria — Ikeja, Eko, Abuja, Ibadan, Enugu, Port Harcourt, Jos, Kaduna, Kano, Benin, and Yola.' },
  { question: 'Is there a minimum recharge amount?', answer: 'Yes, the minimum is \u20A6500. Maximum is \u20A6100,000 per transaction.' },
  { question: 'Are there any service charges?', answer: 'Nope! Zero service fees. You pay exactly what you choose.' },
  { question: 'What if my token doesn\'t arrive?', answer: 'Check your recharge history for status updates. Our support team is also available to resolve any issues quickly.' },
  { question: 'Can I recharge someone else\'s meter?', answer: 'Absolutely! Just enter their meter number. You can verify details before paying.' },
]

/* ================================================================== */
/*  SUB-COMPONENTS                                                     */
/* ================================================================== */

function StepCardComponent({ step, title, description, index }: { step: '01' | '02' | '03'; title: string; description: string; index: number }) {
  const ref = useReveal<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`reveal stagger-${index + 1} relative bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-100 cartoon-card group`}
    >
      {/* Step number badge */}
      <div className="absolute -top-3 -right-2 w-10 h-10 rounded-full bg-teal-500 text-white text-xs font-extrabold flex items-center justify-center shadow-md shadow-teal-500/20 group-hover:scale-110 transition-transform">
        {step}
      </div>
      <div className="mb-5 cartoon-icon-hover">
        <div className="icon-inner">
          <StepIllustration step={step} />
        </div>
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  )
}

function FeatureCardComponent({ title, description, type, index }: { title: string; description: string; type: string; index: number }) {
  const ref = useReveal<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`reveal stagger-${index + 1} group rounded-3xl border-2 border-slate-100 bg-white p-6 cartoon-card`}
    >
      <div className="mb-4 cartoon-icon-hover">
        <div className="icon-inner">
          <FeatureIllustration type={type} />
        </div>
      </div>
      <h3 className="font-bold text-slate-800 mb-1.5">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  )
}

function TestimonialCard({ name, location, text, avatar, index }: { name: string; location: string; text: string; avatar: string; index: number }) {
  const ref = useReveal<HTMLDivElement>()
  const colors = ['from-teal-400 to-emerald-400', 'from-amber-400 to-orange-400', 'from-violet-400 to-purple-400', 'from-rose-400 to-pink-400', 'from-blue-400 to-cyan-400', 'from-emerald-400 to-teal-400']
  return (
    <div
      ref={ref}
      className={`reveal stagger-${index + 1} bg-white rounded-3xl p-6 border-2 border-slate-100 cartoon-card`}
    >
      {/* Stars */}
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} className="w-4.5 h-4.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
        ))}
      </div>
      <p className="text-sm text-slate-600 leading-relaxed mb-5">"{text}"</p>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[index % colors.length]} flex items-center justify-center text-white text-sm font-extrabold shadow-sm`}>
          {avatar}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{name}</p>
          <p className="text-xs text-slate-400 font-medium">{location}</p>
        </div>
      </div>
    </div>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  const ref = useReveal<HTMLDivElement>()
  return (
    <div ref={ref} className="reveal rounded-2xl border-2 border-slate-100 bg-white overflow-hidden cartoon-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left"
      >
        <span className="text-sm font-bold text-slate-800 pr-4">{question}</span>
        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300 ${open ? 'bg-teal-500 text-white rotate-180' : 'bg-slate-100 text-slate-500'}`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-sm text-slate-500 leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  )
}
