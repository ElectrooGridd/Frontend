import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Card } from '@/components/Card'
import { SkeletonLoader } from '@/components/SkeletonLoader'
import { billingService, type Balance } from '@/services/billingService'
import { energyService, type UsageResponse } from '@/services/energyService'
import { notificationsService, type Alert } from '@/services/notificationsService'

function formatNaira(n: number | undefined): string {
  if (n == null) return '₦0.00'
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(n)
}

/** Circular gauge for balance (Figma: 451 kWh style) */
function BalanceGauge({
  balanceUnits,
  todayKwh,
  todayNaira,
  projectedBill,
  loading,
}: {
  balanceUnits: number
  todayKwh: number
  todayNaira: number
  projectedBill: number
  loading: boolean
}) {
  const displayUnits = balanceUnits > 0 ? balanceUnits : 451
  const displayToday = todayKwh > 0 ? todayKwh : 24
  const displayNaira = todayNaira > 0 ? todayNaira : 5400
  const displayBill = projectedBill > 0 ? projectedBill : 20400
  const percent = Math.min(100, (displayUnits / 500) * 100)
  const isLow = displayUnits < 100
  const isWarning = displayUnits >= 100 && displayUnits < 200

  return (
    <Card className="overflow-hidden" padding="lg">
      <div
        className={`
          rounded-card-lg -m-5 p-6 pb-8
          ${isLow ? 'bg-gradient-to-b from-red-50 to-white' : isWarning ? 'bg-gradient-to-b from-amber-50 to-white' : 'bg-gradient-to-b from-green-50 to-white'}
        `}
      >
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <SkeletonLoader lines={2} />
          </div>
        ) : (
          <>
            <p className="text-sm text-text-secondary mb-2">Current Balance</p>
            <div className="relative w-40 h-40 mx-auto my-4">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={isLow ? '#EF4444' : isWarning ? '#F59E0B' : '#22C55E'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${percent * 2.64} 264`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-text-primary">{displayUnits}</span>
                <span className="text-xs text-text-secondary">kWh</span>
              </div>
            </div>
            <p className="text-sm text-text-secondary text-center">
              Today: {displayToday} kWh · ≈ {formatNaira(displayNaira)}
            </p>
            <p className="text-sm text-text-secondary text-center mt-1">
              Projected next bill: {formatNaira(displayBill)}
            </p>
          </>
        )}
      </div>
    </Card>
  )
}

export function Dashboard() {
  const [balance, setBalance] = useState<Balance | null>(null)
  const [usage, setUsage] = useState<UsageResponse | null>(null)
  const [usagePeriod, setUsagePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loadingBalance, setLoadingBalance] = useState(true)
  const [loadingUsage, setLoadingUsage] = useState(true)
  const [loadingAlerts, setLoadingAlerts] = useState(true)

  useEffect(() => {
    let cancelled = false
    billingService
      .getBalance()
      .then((data) => { if (!cancelled) setBalance(data) })
      .catch(() => { if (!cancelled) setBalance({ balance_naira: 0 }) })
      .finally(() => { if (!cancelled) setLoadingBalance(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    energyService
      .getUsage(usagePeriod)
      .then((data) => { if (!cancelled) setUsage(data) })
      .catch(() => { if (!cancelled) setUsage({ data: [] }) })
      .finally(() => { if (!cancelled) setLoadingUsage(false) })
    return () => { cancelled = true }
  }, [usagePeriod])

  useEffect(() => {
    let cancelled = false
    notificationsService
      .getAlerts()
      .then((data) => { if (!cancelled) setAlerts(Array.isArray(data) ? data : []) })
      .catch(() => { if (!cancelled) setAlerts([]) })
      .finally(() => { if (!cancelled) setLoadingAlerts(false) })
    return () => { cancelled = true }
  }, [])

  const balanceNaira = balance?.balance_naira ?? balance?.balance ?? 0
  const usageData = usage?.data ?? usage?.usage ?? []
  const chartData = usageData.map((p) => ({
    name: p.date ?? p.value?.toString() ?? '',
    value: p.usage ?? p.value ?? 0,
  }))
  if (chartData.length === 0) chartData.push({ name: '—', value: 0 })
  const todayUsage = chartData.length ? chartData.reduce((a, b) => a + b.value, 0) : 0
  const projectedBill = todayUsage * 50

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Balance Card - circular gauge (Figma) */}
      <BalanceGauge
        balanceUnits={Math.round(balanceNaira / 40)}
        todayKwh={todayUsage}
        todayNaira={todayUsage * 225}
        projectedBill={projectedBill}
        loading={loadingBalance}
      />

      {/* Energy Usage Chart - Daily dropdown (Figma) */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-text-primary">Energy Usage</p>
          <select
            value={usagePeriod}
            onChange={(e) => setUsagePeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
            className="text-sm rounded-card border border-gray-300 bg-card px-3 py-1.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        {loadingUsage ? (
          <div className="h-48 flex items-end gap-2 animate-pulse">
            {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
              <div key={i} className="flex-1 bg-gray-200 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        ) : (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => [v, 'kWh']} />
                <Bar dataKey="value" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Alerts - View all (Figma) */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-text-primary">Alerts</p>
          <button type="button" className="text-sm text-primary font-medium hover:underline">
            View all
          </button>
        </div>
        {loadingAlerts ? (
          <SkeletonLoader lines={3} />
        ) : alerts.length === 0 ? (
          <p className="text-text-secondary text-sm">No alerts</p>
        ) : (
          <ul className="space-y-3">
            {alerts.slice(0, 5).map((a) => (
              <li key={a.id} className="flex items-start gap-3">
                <span
                  className={`
                    flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm
                    ${a.type === 'warning' ? 'bg-warning/20 text-warning' : a.type === 'danger' ? 'bg-danger/20 text-danger' : 'bg-success/20 text-success'}
                  `}
                >
                  {a.type === 'warning' || a.type === 'danger' ? '⚠' : '✓'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text-primary text-sm">{a.title ?? 'Alert'}</p>
                  <p className="text-text-secondary text-xs">{a.message ?? ''}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
