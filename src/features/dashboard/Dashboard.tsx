import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts'
import { billingService, type Balance } from '@/services/billingService'
import { energyService, type UsageResponse } from '@/services/energyService'
import { notificationsService, type Alert } from '@/services/notificationsService'
import { userService } from '@/services/userService'

/* ───── Helpers ───── */

function formatNaira(n: number | undefined): string {
  if (n == null) return '₦0.00'
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(n)
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/* ───── Dummy data for demo ───── */

const dummyAlerts: Alert[] = [
  { id: '1', type: 'danger', title: 'High consumption detected', message: 'Unit 4B exceeded 120% of average usage in the last 3 hours', created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
  { id: '2', type: 'warning', title: 'Low balance warning', message: 'Your balance is below 100 kWh — consider topping up soon', created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { id: '3', type: 'info', title: 'Scheduled maintenance', message: 'Planned outage in Zone B3 on Apr 2, 02:00–04:00 WAT', created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
  { id: '4', type: 'success', title: 'Payment confirmed', message: '₦15,000 top-up credited successfully to meter #0472', created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() },
  { id: '5', type: 'warning', title: 'Voltage fluctuation', message: 'Minor voltage irregularity detected on Phase 2 grid', created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() },
]

const hourlyUsageData = Array.from({ length: 24 }, (_, i) => {
  const hour = i
  const base = hour >= 6 && hour <= 9 ? 4.5 : hour >= 17 && hour <= 22 ? 5.8 : hour >= 10 && hour <= 16 ? 3.2 : 1.2
  return { hour: `${hour.toString().padStart(2, '0')}:00`, value: +(base + Math.random() * 2).toFixed(1) }
})

const weeklyTrendData = [
  { day: 'Mon', usage: 42, cost: 1680 },
  { day: 'Tue', usage: 38, cost: 1520 },
  { day: 'Wed', usage: 51, cost: 2040 },
  { day: 'Thu', usage: 45, cost: 1800 },
  { day: 'Fri', usage: 39, cost: 1560 },
  { day: 'Sat', usage: 55, cost: 2200 },
  { day: 'Sun', usage: 48, cost: 1920 },
]

/* ───── Skeleton primitives ───── */

function Shimmer({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/60 ${className}`} style={style} />
}

/* ───── Balance Card ───── */

function BalanceCard({
  balanceNaira,
  balanceUnits,
  todayKwh,
  loading,
}: {
  balanceNaira: number
  balanceUnits: number
  todayKwh: number
  loading: boolean
}) {
  const displayUnits = balanceUnits > 0 ? balanceUnits : 451
  const percent = Math.min(100, (displayUnits / 500) * 100)
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (percent / 100) * circumference
  const isLow = displayUnits < 100
  const isWarning = displayUnits >= 100 && displayUnits < 200
  const gaugeColor = isLow ? '#EF4444' : isWarning ? '#F59E0B' : '#0d9488'
  const gaugeColorLight = isLow ? 'rgba(239,68,68,0.1)' : isWarning ? 'rgba(245,158,11,0.1)' : 'rgba(13,148,136,0.1)'

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <Shimmer className="h-4 w-28 mb-6" />
        <div className="flex items-center justify-center py-4">
          <Shimmer className="w-36 h-36 rounded-full" />
        </div>
        <div className="flex justify-center gap-4 mt-4">
          <Shimmer className="h-16 flex-1 rounded-xl" />
          <Shimmer className="h-16 flex-1 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/60 shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Balance</h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isLow ? 'bg-red-100 text-red-700' : isWarning ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'
          }`}>
            {isLow ? 'Critical' : isWarning ? 'Low' : 'Healthy'}
          </span>
        </div>

        {/* Gauge */}
        <div className="relative w-40 h-40 mx-auto my-3">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r="54" fill="none" stroke={gaugeColorLight} strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54" fill="none" stroke={gaugeColor} strokeWidth="8"
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{displayUnits}</span>
            <span className="text-xs text-slate-400 font-medium">kWh left</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center px-3 py-2.5 rounded-xl bg-slate-50/80">
            <p className="text-base font-bold text-slate-900">{formatNaira(balanceNaira || displayUnits * 40)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Naira value</p>
          </div>
          <div className="text-center px-3 py-2.5 rounded-xl bg-slate-50/80">
            <p className="text-base font-bold text-slate-900">{todayKwh || 24} kWh</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Used today</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───── Quick Actions ───── */

function QuickActions() {
  const actions = [
    {
      to: '/recharge',
      label: 'Top Up',
      desc: 'Recharge meter',
      gradient: 'from-teal-500 to-teal-600',
      bgLight: 'bg-teal-50',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
    },
    {
      to: '/recharge/history',
      label: 'History',
      desc: 'Transactions',
      gradient: 'from-violet-500 to-violet-600',
      bgLight: 'bg-violet-50',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 8v4l3 3" />
          <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
        </svg>
      ),
    },
    {
      to: '/recharge',
      label: 'Pay Bill',
      desc: 'Payment',
      gradient: 'from-amber-500 to-orange-500',
      bgLight: 'bg-amber-50',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map(({ to, label, desc, gradient, icon }) => (
        <Link
          key={label}
          to={to}
          className="group flex flex-col items-center text-center p-4 rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-2.5 shadow-sm group-hover:scale-105 transition-transform`}>
            {icon}
          </div>
          <span className="text-sm font-semibold text-slate-800">{label}</span>
          <span className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">{desc}</span>
        </Link>
      ))}
    </div>
  )
}

/* ───── Usage Chart ───── */

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-xl border border-slate-700">
      <p className="text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-bold">{payload[0].value} kWh</p>
    </div>
  )
}

function UsageCard({
  data,
  period,
  onPeriodChange,
  loading,
}: {
  data: Array<{ name: string; value: number }>
  period: string
  onPeriodChange: (p: 'daily' | 'weekly' | 'monthly') => void
  loading: boolean
}) {
  const periods = ['daily', 'weekly', 'monthly'] as const

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Energy Usage</h3>
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          {periods.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange(p)}
              className={`
                px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all duration-200 capitalize
                ${period === p
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
                }
              `}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-48 flex items-end gap-3 px-2">
          {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
            <Shimmer key={i} className="flex-1 rounded-t-lg" style={{ height: `${h}%` }} />
          ))}
        </div>
      ) : (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(13,148,136,0.04)' }} />
              <Bar dataKey="value" fill="#0d9488" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

/* ───── Alerts Card (with dummy data) ───── */

function AlertIcon({ type }: { type?: string }) {
  const config: Record<string, { bg: string; color: string }> = {
    danger: { bg: 'bg-red-100', color: '#EF4444' },
    warning: { bg: 'bg-amber-100', color: '#F59E0B' },
    success: { bg: 'bg-emerald-100', color: '#10B981' },
    info: { bg: 'bg-blue-100', color: '#3B82F6' },
  }
  const { bg, color } = config[type || 'info'] || config.info

  if (type === 'danger') return (
    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </div>
  )
  if (type === 'warning') return (
    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </div>
  )
  if (type === 'success') return (
    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    </div>
  )
  return (
    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function AlertsCard({ alerts, loading }: { alerts: Alert[]; loading: boolean }) {
  const displayAlerts = alerts.length > 0 ? alerts : dummyAlerts

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent Alerts</h3>
        <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
          {displayAlerts.length}
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Shimmer className="w-8 h-8 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Shimmer className="h-3 w-2/3" />
                <Shimmer className="h-2.5 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ul className="space-y-1">
          {displayAlerts.slice(0, 5).map((a) => (
            <li
              key={a.id}
              className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-default"
            >
              <AlertIcon type={a.type} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-800 text-[13px] leading-snug">{a.title ?? 'Alert'}</p>
                <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed line-clamp-1">{a.message ?? ''}</p>
              </div>
              {a.created_at && (
                <span className="text-[10px] text-slate-300 font-medium mt-0.5 flex-shrink-0 whitespace-nowrap">
                  {timeAgo(a.created_at)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ───── Projected Bill Card ───── */

function ProjectedBillCard({ amount, loading }: { amount: number; loading: boolean }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <Shimmer className="h-4 w-24 mb-4" />
        <Shimmer className="h-8 w-32" />
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white">
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-teal-500/10 -mr-10 -mt-10" />
      <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-teal-500/5 -ml-6 -mb-6" />
      <div className="relative">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Projected Bill</h3>
        <p className="text-2xl font-extrabold tracking-tight">{formatNaira(amount || 20400)}</p>
        <p className="text-[11px] text-slate-500 mt-1">This billing cycle estimate</p>
        <Link
          to="/recharge"
          className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
        >
          Top up now
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </div>
  )
}

/* ───── Hourly Usage Heatmap ───── */

function UsageHeatmap() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">24h Usage Pattern</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Energy consumption by hour</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <span>Low</span>
          <div className="flex gap-0.5">
            {['bg-teal-100', 'bg-teal-200', 'bg-teal-300', 'bg-teal-400', 'bg-teal-500', 'bg-teal-600'].map((c) => (
              <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
          </div>
          <span>High</span>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-1">
        {hourlyUsageData.map(({ hour, value }) => {
          const intensity = Math.min(5, Math.floor((value / 8) * 5))
          const colors = ['bg-teal-50', 'bg-teal-100', 'bg-teal-200', 'bg-teal-300', 'bg-teal-400', 'bg-teal-500']
          return (
            <div key={hour} className="group relative">
              <div className={`aspect-square rounded-md ${colors[intensity]} transition-all duration-200 group-hover:ring-2 group-hover:ring-teal-300 group-hover:ring-offset-1 cursor-default`} />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-10">
                <div className="bg-slate-900 text-white text-[10px] font-medium px-2 py-1 rounded-md whitespace-nowrap shadow-lg">
                  {hour} — {value} kWh
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-2 px-0.5">
        <span className="text-[9px] text-slate-300">00:00</span>
        <span className="text-[9px] text-slate-300">06:00</span>
        <span className="text-[9px] text-slate-300">12:00</span>
        <span className="text-[9px] text-slate-300">18:00</span>
        <span className="text-[9px] text-slate-300">23:00</span>
      </div>
    </div>
  )
}

/* ───── Weekly Trend Chart ───── */

function WeeklyTrendCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Weekly Trend</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">kWh consumed per day</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-900">318 <span className="text-xs font-medium text-slate-400">kWh</span></p>
          <p className="text-[10px] text-emerald-600 font-semibold">-8% vs last week</p>
        </div>
      </div>
      <div className="h-36 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weeklyTrendData}>
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={30} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="bg-slate-900 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-xl border border-slate-700">
                    <p className="text-slate-400 mb-0.5">{label}</p>
                    <p className="text-sm font-bold">{payload[0].value} kWh</p>
                    <p className="text-[10px] text-slate-400">{formatNaira((payload[0].value as number) * 40)}</p>
                  </div>
                )
              }}
            />
            <Area type="monotone" dataKey="usage" stroke="#0d9488" strokeWidth={2} fill="url(#trendGradient)" dot={{ r: 3, fill: '#0d9488', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#0d9488' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* ───── Quick Stats Row ───── */

function QuickStats() {
  const stats = [
    { label: 'Avg Daily', value: '45.4 kWh', change: '-3.2%', positive: true },
    { label: 'Peak Hour', value: '6.8 kWh', change: '18:00', neutral: true },
    { label: 'This Month', value: '₦54,200', change: '+12%', positive: false },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(({ label, value, change, positive, neutral }) => (
        <div key={label} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-lg font-bold text-slate-900 mt-1">{value}</p>
          <p className={`text-[11px] font-semibold mt-0.5 ${neutral ? 'text-slate-400' : positive ? 'text-emerald-600' : 'text-red-500'}`}>
            {change}
          </p>
        </div>
      ))}
    </div>
  )
}

/* ───── Main Dashboard ───── */

export function Dashboard() {
  const [userName, setUserName] = useState('')
  const [balance, setBalance] = useState<Balance | null>(null)
  const [usage, setUsage] = useState<UsageResponse | null>(null)
  const [usagePeriod, setUsagePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loadingBalance, setLoadingBalance] = useState(true)
  const [loadingUsage, setLoadingUsage] = useState(true)
  const [loadingAlerts, setLoadingAlerts] = useState(true)

  useEffect(() => {
    userService.getMe().then((u) => setUserName(u.name?.split(' ')[0] ?? '')).catch(() => {})
  }, [])

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
    setLoadingUsage(true)
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
  const chartData = usage?.data ?? []
  const chartDataFormatted = chartData.length ? chartData : [{ name: '—', value: 0 }]
  const todayUsage = chartDataFormatted.reduce((a, b) => a + b.value, 0)
  const projectedBill = todayUsage * 50

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {getGreeting()}{userName ? `, ${userName}` : ''}
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Here's your energy overview for today.</p>
      </div>

      {/* Quick actions */}
      <QuickActions />

      {/* Quick Stats */}
      <QuickStats />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          <BalanceCard
            balanceNaira={balanceNaira}
            balanceUnits={Math.round(balanceNaira / 40)}
            todayKwh={todayUsage}
            loading={loadingBalance}
          />
          <ProjectedBillCard amount={projectedBill} loading={loadingBalance} />
        </div>

        {/* Right column */}
        <div className="lg:col-span-3 space-y-5">
          <UsageCard
            data={chartDataFormatted}
            period={usagePeriod}
            onPeriodChange={setUsagePeriod}
            loading={loadingUsage}
          />
          <AlertsCard alerts={alerts} loading={loadingAlerts} />
        </div>
      </div>

      {/* Full width section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <UsageHeatmap />
        <WeeklyTrendCard />
      </div>
    </div>
  )
}
