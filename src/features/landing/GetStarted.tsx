import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/Button'
import { SEO } from '@/components/SEO'
import { ScrollIndicator } from '@/components/ScrollIndicator'
import { WaitlistModal } from '@/components/WaitlistModal'
import { Events, trackEvent } from '@/services/analytics'
import { quickRechargeService, type QuickVerifyResponse } from '@/services/quickRechargeService'

const DISCOS = ['IKEDC', 'EKEDC', 'AEDC', 'IBEDC', 'PHED', 'EEDC', 'KEDCO', 'JED']

const FAQS = [
  {
    q: 'How long does it take to get my token?',
    a: 'Most tokens arrive within 30 seconds of a successful payment. If your DISCO is experiencing delays, your purchase is queued and delivered as soon as their system confirms.',
  },
  {
    q: 'Is my payment secure?',
    a: 'Payments are processed by Paystack, a PCI-DSS Level 1 certified provider. We never see or store your card details.',
  },
  {
    q: 'Which DISCOs are supported?',
    a: 'All 11 Nigerian DISCOs including Ikeja (IKEDC), Eko (EKEDC), Abuja (AEDC), Ibadan (IBEDC), Port Harcourt (PHED), Enugu (EEDC), Kano (KEDCO), Jos (JED), Kaduna, Benin, and Yola.',
  },
  {
    q: 'What if I entered the wrong meter number?',
    a: 'We verify every meter against your DISCO before you pay. You will see the registered customer name and can cancel if anything looks wrong.',
  },
]

export function GetStarted() {
  const [meterNumber, setMeterNumber] = useState('')
  const [meterDetails, setMeterDetails] = useState<QuickVerifyResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [waitlistOpen, setWaitlistOpen] = useState(false)

  useEffect(() => {
    trackEvent(Events.LandingPageView, { variant: 'campaign_get_started' })
  }, [])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    trackEvent(Events.ClickVerifyMeter, { source: 'campaign_lp' })
    const num = meterNumber.replace(/\s/g, '')
    if (num.length < 6) { setError('Enter a valid meter number'); return }
    setLoading(true)
    try {
      const res = await quickRechargeService.verifyMeter(num)
      setMeterDetails(res)
      trackEvent(Events.MeterVerificationSuccess, {
        source: 'campaign_lp',
        disco: res.disco_name ?? '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify meter')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    if (!meterDetails) return
    setWaitlistOpen(true)
  }

  return (
    <>
    <SEO
      title="Get Started – Recharge Your Prepaid Meter in Seconds"
      description="Verify your meter and buy DISCO electricity tokens in under a minute. Supports IKEDC, EKEDC, AEDC, IBEDC, PHED, EEDC, KEDCO, JED and more."
      path="/get-started"
    />
    <div
      className="min-h-screen bg-[#FAFDF9] text-slate-900"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <ScrollIndicator />
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#FAFDF9]/85 border-b border-teal-100/50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/images/logo.png" alt="ElectroGrid" className="w-10 h-10 object-contain" />
            <span className="font-bold text-slate-800">ElectroGrid</span>
          </Link>
          <Button
            size="sm"
            onClick={() => setWaitlistOpen(true)}
            className="bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-lg shadow-md shadow-teal-500/20"
          >
            Join waitlist
          </Button>
        </div>
      </nav>

      {/* Hero with inline verify */}
      <section className="px-6 pt-12 pb-16 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold bg-teal-50 text-teal-700 rounded-full border border-teal-100">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" /> Live on all 11 DISCOs
            </span>
            <h1 className="mt-4 text-4xl md:text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-900">
              Electricity tokens in <span className="text-teal-600">30 seconds.</span>
            </h1>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              Verify any DISCO meter, top up instantly, and track every kWh — all from one place.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-slate-700">
              <li className="flex items-center gap-2"><Check /> No hidden fees. Token delivered to your meter, not your email.</li>
              <li className="flex items-center gap-2"><Check /> Payments secured by Paystack (PCI-DSS Level 1).</li>
              <li className="flex items-center gap-2"><Check /> Real-time usage tracking, weekly insights.</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-teal-100/60 p-6 md:p-7">
            <div className="text-xs font-semibold text-teal-700 uppercase tracking-wide">Start here</div>
            <h2 className="mt-1 text-xl font-bold text-slate-800">Verify your meter</h2>
            <p className="mt-1 text-sm text-slate-500">We'll look it up against your DISCO instantly.</p>

            {!meterDetails ? (
              <form onSubmit={handleVerify} className="mt-5 space-y-3">
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={meterNumber}
                  onChange={(e) => setMeterNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Enter meter number"
                  className="w-full h-12 px-4 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none text-base tracking-wide"
                  autoFocus
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                  {loading ? 'Verifying…' : 'Verify meter'}
                </Button>
                <p className="text-xs text-slate-400 text-center">
                  By continuing you agree to ElectroGrid's Terms and Privacy Policy.
                </p>
              </form>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="rounded-lg bg-teal-50 border border-teal-100 p-4">
                  <div className="text-xs uppercase text-teal-700 font-semibold">Meter verified</div>
                  <div className="mt-1 text-lg font-bold text-slate-800">{meterDetails.customer_name}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {meterDetails.disco_name} · {meterDetails.meter_type} · {meterDetails.meter_number}
                  </div>
                </div>
                <Button onClick={handleContinue} className="w-full h-12 text-base font-semibold">
                  Get notified at launch
                </Button>
                <button
                  onClick={() => { setMeterDetails(null); setMeterNumber('') }}
                  className="w-full text-sm text-slate-500 hover:text-slate-700"
                >
                  Use a different meter
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trust row */}
      <section className="px-6 py-10 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
            Supported across every major DISCO
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {DISCOS.map((d) => (
              <span
                key={d}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-full text-slate-700"
              >
                {d}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><Lock /> Paystack secured</span>
            <span className="flex items-center gap-1.5"><Check /> Instant token delivery</span>
            <span className="flex items-center gap-1.5"><Check /> 24/7 support</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-center text-3xl font-extrabold text-slate-900">How it works</h2>
        <p className="mt-2 text-center text-slate-500">Three steps. Under a minute.</p>
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {[
            { n: '1', t: 'Verify your meter', d: 'Enter your meter number. We confirm the customer name with your DISCO.' },
            { n: '2', t: 'Top up instantly', d: 'Pay securely with card, bank, USSD, or transfer. Token delivered to your meter in seconds.' },
            { n: '3', t: 'Track your usage', d: 'See kWh balance, recharge history, and weekly usage trends in one dashboard.' },
          ].map((s) => (
            <div key={s.n} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center">
                {s.n}
              </div>
              <h3 className="mt-4 font-bold text-lg text-slate-800">{s.t}</h3>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 pb-16 max-w-3xl mx-auto">
        <h2 className="text-center text-3xl font-extrabold text-slate-900">Questions, answered</h2>
        <div className="mt-8 space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="group bg-white rounded-xl border border-slate-100 p-5">
              <summary className="cursor-pointer font-semibold text-slate-800 list-none flex justify-between items-center">
                {f.q}
                <span className="text-teal-600 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-3xl mx-auto bg-teal-600 rounded-2xl p-8 md:p-10 text-center">
          <h2 className="text-3xl font-extrabold text-white">Buy your first token in 30 seconds.</h2>
          <p className="mt-2 text-teal-50">Thousands of Nigerians already use ElectroGrid every day.</p>
          <a
            href="#top"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="inline-block mt-6 px-8 py-3 bg-white text-teal-700 font-bold rounded-lg hover:bg-teal-50 transition"
          >
            Verify my meter
          </a>
        </div>
      </section>

      <footer className="px-6 py-6 text-center text-xs text-slate-400 border-t border-slate-100">
        © {new Date().getFullYear()} ElectroGrid. All rights reserved.
      </footer>
    </div>
    <WaitlistModal
      open={waitlistOpen}
      onClose={() => setWaitlistOpen(false)}
      source="get_started"
      prefillMeter={meterDetails?.meter_number}
      prefillDisco={meterDetails?.disco_name}
    />
    </>
  )
}

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-teal-600 flex-shrink-0">
      <path d="M5 10.5l3 3 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Lock() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="text-slate-500">
      <rect x="4" y="9" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 9V6a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}
