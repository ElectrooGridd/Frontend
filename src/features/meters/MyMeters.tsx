import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMetersStore } from '@/store/metersStore'
import { metersService, type VerifyMeterResponse } from '@/services/metersService'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { AlertBadge } from '@/components/AlertBadge'
import { useToast } from '@/components/ToastNotification'
import type { MeterResponse } from '@/types/api'

export function MyMeters() {
  const toast = useToast()
  const meters = useMetersStore((s) => s.meters)
  const loading = useMetersStore((s) => s.loading)
  const fetchError = useMetersStore((s) => s.error)

  const [showLink, setShowLink] = useState(false)
  const [linkStep, setLinkStep] = useState<'input' | 'confirm' | 'linking'>('input')
  const [meterNumber, setMeterNumber] = useState('')
  const [verifiedMeter, setVerifiedMeter] = useState<VerifyMeterResponse | null>(null)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { useMetersStore.getState().fetch() }, [])

  const resetLink = () => {
    setShowLink(false)
    setLinkStep('input')
    setMeterNumber('')
    setVerifiedMeter(null)
    setError('')
  }

  const handleVerify = async () => {
    setError('')
    if (!meterNumber.trim()) { setError('Enter a meter number'); return }
    setVerifyLoading(true)
    try {
      const res = await metersService.verify(meterNumber.trim())
      setVerifiedMeter(res)
      setLinkStep('confirm')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Meter not found')
    } finally { setVerifyLoading(false) }
  }

  const handleLink = async () => {
    if (!verifiedMeter?.meter_id) {
      setError('This meter is not registered in the system yet. Contact support.')
      return
    }
    setLinkStep('linking')
    setError('')
    try {
      await metersService.linkMeter(verifiedMeter.meter_id)
      await useMetersStore.getState().refresh()
      toast.show('Meter linked successfully', 'success')
      resetLink()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to link meter')
      setLinkStep('confirm')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">My Meters</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your linked meters</p>
        </div>
        <button
          type="button"
          onClick={() => setShowLink(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-teal-600/20 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Link Meter
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatPill label="Linked" value={meters.length} color="teal" />
        <StatPill label="Active" value={meters.filter(m => m.status === 'active').length} color="emerald" />
        <StatPill label="Prepaid" value={meters.filter(m => m.meter_type?.toLowerCase() === 'prepaid').length} color="amber" />
      </div>

      {/* Link Meter — inline card */}
      {showLink && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] p-5 sm:p-6 animate-fade-in-up space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">Link New Meter</h3>
            <button type="button" onClick={resetLink} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {error && <AlertBadge variant="danger" message={error} />}

          {linkStep === 'input' && (
            <div className="space-y-4">
              <Input
                label="Meter number"
                placeholder="e.g. 12345678901"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value)}
                disabled={verifyLoading}
              />
              <Button
                fullWidth
                loading={verifyLoading}
                onClick={handleVerify}
                className="bg-teal-600 hover:bg-teal-500 border-0 rounded-xl"
              >
                Verify meter
              </Button>
            </div>
          )}

          {linkStep === 'confirm' && verifiedMeter && (
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                <DetailRow label="Customer" value={verifiedMeter.customer_name || '\u2014'} />
                <DetailRow label="Meter number" value={verifiedMeter.meter_number || '\u2014'} />
                <DetailRow label="Disco" value={verifiedMeter.disco_name || '\u2014'} />
                <DetailRow label="Type" value={verifiedMeter.meter_type || '\u2014'} />
                <DetailRow label="Status" value={verifiedMeter.status || '\u2014'} />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => { setLinkStep('input'); setVerifiedMeter(null); setError('') }}
                  className="rounded-xl border-2 border-slate-200 hover:border-slate-300"
                >
                  Try another
                </Button>
                <Button
                  fullWidth
                  onClick={handleLink}
                  className="bg-teal-600 hover:bg-teal-500 border-0 rounded-xl"
                >
                  Link meter
                </Button>
              </div>
            </div>
          )}

          {linkStep === 'linking' && (
            <div className="text-center py-6">
              <div className="w-7 h-7 border-[3px] border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-500 mt-3">Linking meter...</p>
            </div>
          )}
        </div>
      )}

      {/* Meters List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-[3px] border-teal-200 border-t-teal-600 rounded-full animate-spin" />
        </div>
      ) : fetchError ? (
        <AlertBadge variant="danger" message={fetchError} />
      ) : meters.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
          </div>
          <p className="text-lg font-bold text-slate-800">No meters linked yet</p>
          <p className="text-sm text-slate-500 mt-1 mb-5">Link your first meter to start recharging</p>
          <Button onClick={() => setShowLink(true)} className="bg-teal-600 hover:bg-teal-500 border-0 rounded-xl">
            Link your first meter
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {meters.map((meter) => (
            <MeterCard key={meter.id} meter={meter} />
          ))}

          {/* Add another */}
          <button
            type="button"
            onClick={() => setShowLink(true)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-teal-300 text-sm font-semibold text-slate-400 hover:text-teal-600 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Link another meter
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Meter Card ─── */
function MeterCard({ meter }: { meter: MeterResponse }) {
  const isActive = meter.status === 'active'

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] p-5 hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-400'}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-bold text-slate-800 truncate">{meter.customer_name || 'Meter'}</p>
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${
              isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
            }`}>
              {meter.status}
            </span>
          </div>
          <p className="text-xs text-slate-500">{meter.meter_number}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            <span className={`px-2 py-0.5 rounded-md font-semibold ${
              meter.meter_type?.toLowerCase() === 'prepaid' ? 'bg-slate-100 text-slate-600' : 'bg-teal-50 text-teal-700'
            }`}>
              {meter.meter_type || 'Unknown'}
            </span>
            {meter.created_at && (
              <span>Linked {new Date(meter.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            )}
          </div>
        </div>

        {/* Recharge button */}
        <Link
          to={`/recharge`}
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-teal-600/20 active:scale-95"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
          Top Up
        </Link>
      </div>
    </div>
  )
}

/* ─── Stat pill ─── */
function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-700 border-teal-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
  }
  return (
    <div className={`rounded-xl border p-3 text-center ${colorMap[color] || colorMap.teal}`}>
      <p className="text-xl font-extrabold">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</p>
    </div>
  )
}

/* ─── Detail row ─── */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
  )
}
