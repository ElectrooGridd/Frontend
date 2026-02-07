import { useState, useEffect } from 'react'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Card } from '@/components/Card'
import { NumberKeypad } from '@/components/NumberKeypad'
import { AlertBadge } from '@/components/AlertBadge'
import { useToast } from '@/components/ToastNotification'
import { metersService, type VerifyMeterResponse } from '@/services/metersService'
import { rechargesService, type RechargeTransaction } from '@/services/rechargesService'

const STEPS = [
  'Verify meter',
  'Is this your meter?',
  'Link meter',
  'Enter amount',
  'Confirm payment',
  'Track status',
] as const

const POLL_INTERVAL = 3000
const POLL_MAX = 20

export function MeterRechargeFlow() {
  const toast = useToast()
  const [step, setStep] = useState<number>(0)
  const [meterNumber, setMeterNumber] = useState('')
  const [meterDetails, setMeterDetails] = useState<VerifyMeterResponse | null>(null)
  const [meterId, setMeterId] = useState('')
  const [alias, setAlias] = useState('')
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
    setAlias('')
    setAmount('')
    setIntentId('')
    setRechargeId('')
    setPaymentRef('')
    setError('')
    setPollCount(0)
  }

  const handleVerify = async () => {
    setError('')
    if (!meterNumber.trim()) {
      setError('Enter meter number')
      return
    }
    setLoading(true)
    try {
      const res = await metersService.verify(meterNumber.trim())
      setMeterDetails(res)
      setMeterId(res.meter_id)
      setStep(1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmMeter = () => {
    setError('')
    setStep(2)
  }

  const handleRejectMeter = () => {
    setMeterDetails(null)
    setMeterId('')
    setStep(0)
  }

  const handleLink = async () => {
    setError('')
    if (!meterId || !alias.trim()) {
      setError('Alias is required')
      return
    }
    setLoading(true)
    try {
      await metersService.linkMeter(meterId, alias.trim())
      setStep(3)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Link failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateIntent = async () => {
    setError('')
    const n = parseFloat(amount)
    if (isNaN(n) || n < 100) {
      setError('Enter at least ₦100')
      return
    }
    setLoading(true)
    try {
      const res = await rechargesService.createIntent(meterId, n)
      setIntentId(res.intent_id)
      setRechargeId(res.recharge_id)
      setStep(4)
      setPaymentRef('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create intent failed')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    setError('')
    if (!intentId || !paymentRef.trim()) {
      setError('Payment reference is required (e.g. from Paystack)')
      return
    }
    setLoading(true)
    try {
      const res: RechargeTransaction = await rechargesService.confirm(
        intentId,
        'paystack',
        paymentRef.trim()
      )
      setRechargeId(res.id)
      setStep(5)
      setPollCount(0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Confirm failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (step !== 5 || !rechargeId || pollCount >= POLL_MAX) return
    const t = setInterval(async () => {
      try {
        const r = await rechargesService.getRecharge(rechargeId)
        const s = (r.status ?? '').toLowerCase()
        if (s === 'completed' || s === 'success') {
          toast.show('Recharge completed successfully', 'success')
          reset()
          return
        }
        if (s === 'failed') {
          setError('Recharge failed')
          return
        }
        setPollCount((c) => c + 1)
      } catch {
        setPollCount((c) => c + 1)
      }
    }, POLL_INTERVAL)
    return () => clearInterval(t)
  }, [step, rechargeId, pollCount, toast])

  const tracking = step === 5 && rechargeId && pollCount < POLL_MAX

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <span
            key={s}
            className={`
              flex-shrink-0 px-2 py-1 rounded text-xs font-medium
              ${i < step ? 'bg-success/20 text-success' : i === step ? 'bg-primary text-white' : 'bg-gray-200 text-text-secondary'}
            `}
          >
            {i + 1}. {s}
          </span>
        ))}
      </div>

      {error && <AlertBadge variant="danger" message={error} />}

      <Card>
        {step === 0 && (
          <>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Verify meter</h3>
            <Input
              label="Meter number"
              placeholder="Enter meter number"
              value={meterNumber}
              onChange={(e) => setMeterNumber(e.target.value)}
              disabled={loading}
            />
            <Button className="mt-4" fullWidth loading={loading} onClick={handleVerify}>
              Verify
            </Button>
          </>
        )}

        {step === 1 && meterDetails && (
          <>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Is this your meter?</h3>
            <div className="rounded-card bg-background p-4 space-y-2 text-sm">
              <p><span className="text-text-secondary">Customer:</span> {meterDetails.customer_name}</p>
              <p><span className="text-text-secondary">Meter number:</span> {meterDetails.meter_number}</p>
              <p><span className="text-text-secondary">Disco:</span> {meterDetails.disco_name}</p>
              <p><span className="text-text-secondary">Meter type:</span> {meterDetails.meter_type}</p>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="secondary" fullWidth onClick={handleRejectMeter}>
                No, try another
              </Button>
              <Button fullWidth onClick={handleConfirmMeter}>
                Yes, continue
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Link meter</h3>
            {meterDetails && (
              <p className="text-sm text-text-secondary mb-2">
                {meterDetails.disco_name} · {meterDetails.meter_number}
              </p>
            )}
            <Input
              label="Alias (e.g. Home, My Apartment)"
              placeholder="My Apartment"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              disabled={loading}
            />
            <Button className="mt-4" fullWidth loading={loading} onClick={handleLink}>
              Link meter
            </Button>
            <Button variant="secondary" className="mt-2" fullWidth onClick={() => setStep(1)}>
              Back
            </Button>
          </>
        )}

        {step === 3 && (
          <>
            <h3 className="text-xl font-semibold text-text-primary mb-1">Credit Top-up</h3>
            <p className="text-text-secondary text-sm mb-6">
              Bypass the token. Sync credit wirelessly to your device.
            </p>
            <p className="text-sm text-text-secondary mb-2">Enter Amount</p>
            <div className="mb-1 flex items-baseline justify-center gap-0.5">
              <span className="text-2xl font-semibold text-text-primary">N</span>
              <span className="text-2xl font-bold text-text-primary font-mono">
                {amount ? parseFloat(amount).toFixed(2) : '0.00'}
              </span>
            </div>
            <p className="text-sm text-success font-medium mb-4">
              ≈ {amount ? (parseFloat(amount) / 25).toFixed(1) : '0'} kWh
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {[1000, 2000, 5000, 10000].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAmount(String(n))}
                  className="px-4 py-2 rounded-card bg-gray-100 text-text-primary text-sm font-medium hover:bg-gray-200"
                >
                  N {n.toLocaleString()}
                </button>
              ))}
            </div>
            <Button
              fullWidth
              loading={loading}
              onClick={handleCreateIntent}
              disabled={!amount || parseFloat(amount) < 100}
            >
              Top-up Meter
            </Button>
            <div className="mt-6">
              <NumberKeypad value={amount} onChange={setAmount} decimal />
            </div>
            <Button variant="secondary" className="mt-4" fullWidth onClick={() => setStep(2)}>
              Back
            </Button>
          </>
        )}

        {step === 4 && (
          <>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Confirm payment</h3>
            <p className="text-sm text-text-secondary mb-2">Amount: ₦{amount}</p>
            <Input
              label="Payment reference (from Paystack)"
              placeholder="e.g. paystack_ref_123"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              disabled={loading}
            />
            <Button className="mt-4" fullWidth loading={loading} onClick={handleConfirm}>
              Confirm recharge
            </Button>
            <Button variant="secondary" className="mt-2" fullWidth onClick={() => setStep(3)}>
              Back
            </Button>
          </>
        )}

        {step === 5 && (
          <>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Recharge status</h3>
            {tracking ? (
              <div className="text-center py-6">
                <p className="text-text-secondary mb-2">Tracking recharge…</p>
                <p className="text-sm text-text-secondary">Recharge ID: {rechargeId}</p>
                <p className="text-xs text-text-secondary mt-4">Polling for completion…</p>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-success font-medium mb-2">Recharge submitted</p>
                <p className="text-sm text-text-secondary">Recharge ID: {rechargeId}</p>
                <Button className="mt-4" fullWidth onClick={reset}>
                  New recharge
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
