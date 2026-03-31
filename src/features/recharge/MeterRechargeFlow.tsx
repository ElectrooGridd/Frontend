import { useState, useEffect } from 'react'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { NumberKeypad } from '@/components/NumberKeypad'
import { AlertBadge } from '@/components/AlertBadge'
import { useToast } from '@/components/ToastNotification'
import { metersService, type VerifyMeterResponse } from '@/services/metersService'
import { rechargesService, type RechargeTransaction } from '@/services/rechargesService'
import { useBillingStore } from '@/store/billingStore'
import { useRechargesStore } from '@/store/rechargesStore'
import { useMetersStore } from '@/store/metersStore'

const STEPS = [
  { label: 'Verify', icon: <SearchIcon /> },
  { label: 'Confirm', icon: <ShieldIcon /> },
  { label: 'Link', icon: <LinkIcon /> },
  { label: 'Amount', icon: <WalletIcon /> },
  { label: 'Pay', icon: <CardIcon /> },
  { label: 'Status', icon: <BoltIcon /> },
] as const

const POLL_INTERVAL = 3000
const POLL_MAX = 20

export function MeterRechargeFlow() {
  const toast = useToast()
  const [step, setStep] = useState<number>(0)
  const [meterNumber, setMeterNumber] = useState('')
  const [meterDetails, setMeterDetails] = useState<VerifyMeterResponse | null>(null)
  const [meterId, setMeterId] = useState('')
  const [amount, setAmount] = useState('')
  const [intentId, setIntentId] = useState('')
  const [rechargeId, setRechargeId] = useState('')
  const [paymentRef, setPaymentRef] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pollCount, setPollCount] = useState(0)

  const reset = () => {
    setStep(0)
    setMeterNumber('')
    setMeterDetails(null)
    setMeterId('')
    setAmount('')
    setIntentId('')
    setRechargeId('')
    setPaymentRef('')
    setError('')
    setPollCount(0)
  }

  const handleVerify = async () => {
    setError('')
    if (!meterNumber.trim()) { setError('Enter meter number'); return }
    setLoading(true)
    try {
      const res = await metersService.verify(meterNumber.trim())
      setMeterDetails(res)
      setMeterId(res.meter_id ?? '')
      setStep(1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed')
    } finally { setLoading(false) }
  }

  const handleConfirmMeter = () => { setError(''); setStep(2) }
  const handleRejectMeter = () => { setMeterDetails(null); setMeterId(''); setStep(0) }

  const handleLink = async () => {
    setError('')
    if (!meterId) { setError('This meter is not registered in the system yet. Please contact support.'); return }
    setLoading(true)
    try {
      await metersService.linkMeter(meterId)
      useMetersStore.getState().refresh() // Update global meters list
      setStep(3)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Link failed')
    } finally { setLoading(false) }
  }

  const handleCreateIntent = async () => {
    setError('')
    const n = parseFloat(amount)
    if (isNaN(n) || n < 100) { setError('Enter at least \u20A6100'); return }
    setLoading(true)
    try {
      const res = await rechargesService.createIntent(meterId, n)
      setIntentId(res.intent_id)
      setRechargeId(res.recharge_id)
      setStep(4)
      setPaymentRef('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create intent failed')
    } finally { setLoading(false) }
  }

  const handleConfirm = async () => {
    setError('')
    if (!intentId || !paymentRef.trim()) { setError('Payment reference is required (e.g. from Paystack)'); return }
    setLoading(true)
    try {
      const res: RechargeTransaction = await rechargesService.confirm(intentId, 'paystack', paymentRef.trim())
      setRechargeId(res.id)
      setStep(5)
      setPollCount(0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Confirm failed')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    if (step !== 5 || !rechargeId || pollCount >= POLL_MAX) return
    const t = setInterval(async () => {
      try {
        const r = await rechargesService.getRecharge(rechargeId)
        const s = (r.status ?? '').toLowerCase()
        if (s === 'completed' || s === 'success') {
              toast.show('Recharge completed successfully', 'success')
              // Refresh global stores so dashboard/history reflect the new recharge
              useBillingStore.getState().refresh()
              useRechargesStore.getState().refresh()
              reset()
              return
            }
        if (s === 'failed') { setError('Recharge failed'); return }
        setPollCount((c) => c + 1)
      } catch { setPollCount((c) => c + 1) }
    }, POLL_INTERVAL)
    return () => clearInterval(t)
  }, [step, rechargeId, pollCount, toast])

  const tracking = step === 5 && rechargeId && pollCount < POLL_MAX

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in-up">

      {/* ─── Header ─── */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-full px-4 py-1.5 mb-4">
          <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
          <span className="text-xs font-bold text-teal-700 tracking-wide">Smart Recharge</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Top up your meter</h1>
        <p className="text-sm text-slate-500 mt-1">Fast, secure, wireless credit delivery</p>
      </div>

      {/* ─── Step indicator ─── */}
      <div className="relative">
        {/* Progress bar background */}
        <div className="absolute top-5 left-8 right-8 h-0.5 bg-slate-100 rounded-full" />
        {/* Progress bar fill */}
        <div
          className="absolute top-5 left-8 h-0.5 bg-teal-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `calc(${(step / (STEPS.length - 1)) * 100}% - 64px * ${1 - step / (STEPS.length - 1)})` }}
        />
        {/* Step dots */}
        <div className="relative flex items-start justify-between">
          {STEPS.map((s, i) => {
            const isComplete = i < step
            const isCurrent = i === step
            return (
              <div key={s.label} className="flex flex-col items-center" style={{ width: 56 }}>
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                  ${isComplete
                    ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20 scale-100'
                    : isCurrent
                      ? 'bg-white border-2 border-teal-500 text-teal-600 shadow-md shadow-teal-500/10 scale-110'
                      : 'bg-slate-100 text-slate-400 scale-90'
                  }
                `}>
                  {isComplete ? (
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  ) : (
                    <span className="w-4 h-4">{s.icon}</span>
                  )}
                </div>
                <span className={`mt-1.5 text-[10px] font-semibold tracking-wide ${isCurrent ? 'text-teal-600' : isComplete ? 'text-slate-500' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── Error ─── */}
      {error && (
        <div className="animate-scale-in">
          <AlertBadge variant="danger" message={error} />
        </div>
      )}

      {/* ─── Card ─── */}
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.07)] border border-slate-100 p-6 sm:p-8 transition-all">

        {/* STEP 0: Verify meter */}
        {step === 0 && (
          <div className="animate-fade-in-up space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                <SearchIcon />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Verify your meter</h3>
                <p className="text-xs text-slate-500">Enter your prepaid or postpaid meter number</p>
              </div>
            </div>
            <Input
              label="Meter number"
              placeholder="e.g. 12345678901"
              value={meterNumber}
              onChange={(e) => setMeterNumber(e.target.value)}
              disabled={loading}
            />
            <Button
              className="mt-2 bg-teal-600 hover:bg-teal-500 border-0 rounded-xl"
              fullWidth
              loading={loading}
              onClick={handleVerify}
            >
              Verify meter
            </Button>
          </div>
        )}

        {/* STEP 1: Confirm meter */}
        {step === 1 && meterDetails && (
          <div className="animate-fade-in-up space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <ShieldIcon />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Is this your meter?</h3>
                <p className="text-xs text-slate-500">Please confirm the details below</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-100 divide-y divide-slate-100 overflow-hidden">
              <DetailRow label="Customer" value={meterDetails.customer_name || '—'} />
              <DetailRow label="Meter number" value={meterDetails.meter_number || '—'} />
              <DetailRow label="Disco" value={meterDetails.disco_name || '—'} />
              <DetailRow label="Meter type" value={meterDetails.meter_type || '—'} />
              <DetailRow label="Status" value={meterDetails.status || '—'} />
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={handleRejectMeter}
                className="rounded-xl border-2 border-slate-200 hover:border-slate-300"
              >
                No, try another
              </Button>
              <Button
                fullWidth
                onClick={handleConfirmMeter}
                className="bg-teal-600 hover:bg-teal-500 border-0 rounded-xl"
              >
                Yes, continue
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Link meter */}
        {step === 2 && (
          <div className="animate-fade-in-up space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <LinkIcon />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Link meter to account</h3>
                <p className="text-xs text-slate-500">This lets you recharge faster next time</p>
              </div>
            </div>

            {meterDetails && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{meterDetails.disco_name}</p>
                  <p className="text-xs text-slate-500">{meterDetails.meter_number}</p>
                </div>
              </div>
            )}

            <Button
              className="bg-teal-600 hover:bg-teal-500 border-0 rounded-xl"
              fullWidth
              loading={loading}
              onClick={handleLink}
            >
              Link meter
            </Button>
            <Button
              variant="ghost"
              className="rounded-xl"
              fullWidth
              onClick={() => setStep(1)}
            >
              Back
            </Button>
          </div>
        )}

        {/* STEP 3: Enter amount */}
        {step === 3 && (
          <div className="animate-fade-in-up space-y-5">
            <div className="text-center mb-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 mb-3">
                <WalletIcon />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Enter amount</h3>
              <p className="text-xs text-slate-500">How much would you like to recharge?</p>
            </div>

            {/* Amount display */}
            <div className="text-center py-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-100">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Amount</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-2xl font-bold text-slate-400">{'\u20A6'}</span>
                <span className="text-4xl font-extrabold text-slate-800 font-mono tracking-tight">
                  {amount ? parseFloat(amount).toLocaleString() : '0'}
                </span>
              </div>
              <p className="text-sm text-teal-600 font-semibold mt-1">
                {'\u2248'} {amount ? (parseFloat(amount) / 25).toFixed(1) : '0'} kWh
              </p>
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-2">
              {[1000, 2000, 5000, 10000].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAmount(String(n))}
                  className={`
                    py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                    ${amount === String(n)
                      ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20 scale-[1.02]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95'
                    }
                  `}
                >
                  {'\u20A6'}{(n / 1000).toFixed(0)}k
                </button>
              ))}
            </div>

            <Button
              fullWidth
              loading={loading}
              onClick={handleCreateIntent}
              disabled={!amount || parseFloat(amount) < 100}
              className="bg-teal-600 hover:bg-teal-500 border-0 rounded-xl py-3.5 text-base font-bold"
            >
              Top up meter
            </Button>

            <NumberKeypad value={amount} onChange={setAmount} decimal />

            <Button variant="ghost" className="rounded-xl" fullWidth onClick={() => setStep(2)}>
              Back
            </Button>
          </div>
        )}

        {/* STEP 4: Confirm payment */}
        {step === 4 && (
          <div className="animate-fade-in-up space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <CardIcon />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Confirm payment</h3>
                <p className="text-xs text-slate-500">Enter your payment reference to complete</p>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 p-5 text-white">
              <p className="text-xs uppercase tracking-wider opacity-80 mb-1">You're paying</p>
              <p className="text-3xl font-extrabold">{'\u20A6'}{parseFloat(amount).toLocaleString()}</p>
              <p className="text-sm opacity-80 mt-1">{'\u2248'} {(parseFloat(amount) / 25).toFixed(1)} kWh</p>
              {meterDetails && (
                <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                  </div>
                  <span className="text-sm">{meterDetails.meter_number} &middot; {meterDetails.disco_name}</span>
                </div>
              )}
            </div>

            <Input
              label="Payment reference"
              placeholder="e.g. paystack_ref_123"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              disabled={loading}
            />
            <Button
              className="bg-teal-600 hover:bg-teal-500 border-0 rounded-xl py-3.5 text-base font-bold"
              fullWidth
              loading={loading}
              onClick={handleConfirm}
            >
              Confirm recharge
            </Button>
            <Button variant="ghost" className="rounded-xl" fullWidth onClick={() => setStep(3)}>
              Back
            </Button>
          </div>
        )}

        {/* STEP 5: Track status */}
        {step === 5 && (
          <div className="animate-fade-in-up">
            {tracking ? (
              <div className="text-center py-8 space-y-4">
                {/* Animated spinner */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-50 mb-2">
                  <div className="w-8 h-8 border-[3px] border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Processing recharge</h3>
                <p className="text-sm text-slate-500">Hang tight, we're sending credit to your meter...</p>
                <div className="inline-flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-500">
                  <span className="font-mono">{rechargeId}</span>
                </div>
                {/* Progress dots */}
                <div className="flex justify-center gap-1.5 pt-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"
                      style={{ animationDelay: `${i * 0.3}s` }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 mb-2">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800">Recharge submitted!</h3>
                <p className="text-sm text-slate-500">Your meter credit is on the way.</p>
                <div className="inline-flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-500">
                  <span className="font-mono">{rechargeId}</span>
                </div>
                <Button
                  className="mt-4 bg-teal-600 hover:bg-teal-500 border-0 rounded-xl"
                  fullWidth
                  onClick={reset}
                >
                  New recharge
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Detail row helper ─── */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
  )
}

/* ─── Step icons ─── */
function SearchIcon() {
  return <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
}
function ShieldIcon() {
  return <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
}
function LinkIcon() {
  return <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-4.568a4.5 4.5 0 00-6.364-6.364L6.938 3.59a4.5 4.5 0 001.242 7.244" /></svg>
}
function WalletIcon() {
  return <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h5.25A2.25 2.25 0 0121 6v0m0 6v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6m0 6h-2.25" /></svg>
}
function CardIcon() {
  return <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
}
function BoltIcon() {
  return <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
}
