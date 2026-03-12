import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/Card'

type Tab = 'command-center' | 'revenue-protection' | 'customer-crm'

export function Compliance() {
  const [tab, setTab] = useState<Tab>('command-center')

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Top command strip */}
      <div className="mt-2 mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-teal-700 uppercase">
            Operations console
          </p>
          <h1 className="text-2xl font-bold text-slate-900">ElectroGrid Compliance Center</h1>
          <p className="text-sm text-slate-500">
            Monitor incidents, customer complaints, and compliance actions in one place.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          ← Back to app dashboard
        </Link>
      </div>

      {/* Secondary nav (Command Center / Revenue Protection / Customer CRM) */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-50 via-emerald-50 to-slate-50 border border-slate-100 px-3 py-2 sm:px-4 sm:py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm text-teal-600 font-semibold">
            EG
          </span>
          <div>
            <p className="font-semibold text-slate-900">ElectroGrid Console</p>
            <p className="text-[11px] text-slate-500">
              Internal view for compliance, incidents, and customer issues.
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full bg-white/70 p-1 shadow-sm border border-slate-100 overflow-x-auto">
          <TabChip
            label="Command Center"
            active={tab === 'command-center'}
            onClick={() => setTab('command-center')}
          />
          <TabChip
            label="Revenue Protection"
            active={tab === 'revenue-protection'}
            onClick={() => setTab('revenue-protection')}
          />
          <TabChip
            label="Customer CRM"
            active={tab === 'customer-crm'}
            onClick={() => setTab('customer-crm')}
          />
        </div>
      </div>

      {tab === 'command-center' && <CommandCenterView />}
      {tab === 'revenue-protection' && <RevenueProtectionView />}
      {tab === 'customer-crm' && <CustomerCrmView />}
    </div>
  )
}

type TabChipProps = { label: string; active: boolean; onClick: () => void }

function TabChip({ label, active, onClick }: TabChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
        active
          ? 'bg-teal-600 text-white shadow-sm'
          : 'bg-transparent text-slate-600 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  )
}

// --- COMMAND CENTER VIEW ---

function CommandCenterView() {
  return (
    <div className="space-y-4">
      {/* KPI cards row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Critical faults" value="12" sub="5 received today" tone="danger" />
        <KpiCard title="Revenue efficiency" value="87.6%" sub="+3.1% this month" tone="success" />
        <KpiCard title="Open tickets" value="48" sub="12 high priority" tone="warning" />
        <KpiCard title="Active crews" value="8 / 12" sub="5 available" tone="info" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.5fr)]">
        {/* Tamper & meter monitoring */}
        <Card className="h-[420px] flex flex-col">
          <SectionHeader title="Tamper & Meter Monitoring" />
          <ComplianceList
            items={[
              {
                title: 'Meter bypass detected',
                meta: 'Zone A · 3 mins ago',
                tag: 'High risk',
                tone: 'danger',
              },
              {
                title: 'Reverse energy anomaly',
                meta: 'Zone B · 16 mins ago',
                tag: 'Medium',
                tone: 'warning',
              },
              {
                title: 'Voltage fluctuation',
                meta: 'Zone C · 32 mins ago',
                tag: 'Info',
                tone: 'info',
              },
            ]}
          />
        </Card>

        {/* Live customer complaints */}
        <Card className="h-[420px] flex flex-col">
          <SectionHeader title="Live Customer Complaints" />
          <ComplianceList
            items={[
              { title: 'Omolade Moses', meta: 'Token rejected · 4 mins ago', tag: 'High', tone: 'danger' },
              { title: 'Abisola Adebisi', meta: 'No light · 8 mins ago', tag: 'Medium', tone: 'warning' },
              { title: 'Tunde Olutayo', meta: 'Low voltage · 17 mins ago', tag: 'Queued', tone: 'info' },
            ]}
          />
        </Card>

        {/* Right column: quick actions + context */}
        <div className="space-y-4">
          <Card className="space-y-3">
            <SectionHeader title="Quick actions" />
            <div className="grid gap-3 sm:grid-cols-2">
              <QuickActionCard label="Dispatch crew" tone="success" />
              <QuickActionCard label="Broadcast alert" tone="warning" />
              <QuickActionCard label="Generate revenue report" tone="info" full />
            </div>
          </Card>
          <Card className="space-y-3">
            <SectionHeader title="Operational context" />
            <div className="flex items-center justify-between text-xs text-slate-600">
              <div>
                <p className="font-semibold text-slate-900">Abuja</p>
                <p>Partly cloudy · 32°C</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">12 teams</p>
                <p className="text-teal-600">8 available</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

type KpiTone = 'danger' | 'success' | 'warning' | 'info'

type KpiCardProps = { title: string; value: string; sub: string; tone: KpiTone }

function KpiCard({ title, value, sub, tone }: KpiCardProps) {
  const toneClasses: Record<KpiTone, string> = {
    danger: 'border-red-100 bg-red-50',
    success: 'border-emerald-100 bg-emerald-50',
    warning: 'border-amber-100 bg-amber-50',
    info: 'border-sky-100 bg-sky-50',
  }

  return (
    <Card className="py-4 px-4 flex flex-col justify-between">
      <p className="text-xs font-medium text-slate-500 mb-1">{title}</p>
      <p className="text-2xl font-semibold text-slate-900 mb-1">{value}</p>
      <p className="text-[11px] text-slate-500">{sub}</p>
      <div className={`mt-3 h-1.5 w-16 rounded-full ${toneClasses[tone]}`} />
    </Card>
  )
}

type ComplianceListItem = {
  title: string
  meta: string
  tag?: string
  tone?: KpiTone
}

type ComplianceListProps = { items: ComplianceListItem[] }

function ComplianceList({ items }: ComplianceListProps) {
  const tagTone: Record<KpiTone, string> = {
    danger: 'text-red-700 bg-red-50 border-red-100',
    success: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    warning: 'text-amber-700 bg-amber-50 border-amber-100',
    info: 'text-sky-700 bg-sky-50 border-sky-100',
  }

  return (
    <div className="mt-3 space-y-2 overflow-auto">
      {items.map((item) => (
        <div
          key={item.title + item.meta}
          className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm"
        >
          <div>
            <p className="font-medium text-slate-900">{item.title}</p>
            <p className="text-xs text-slate-500">{item.meta}</p>
          </div>
          {item.tag && item.tone && (
            <span
              className={`ml-3 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                tagTone[item.tone]
              }`}
            >
              {item.tag}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

type QuickActionCardProps = { label: string; tone: 'success' | 'warning' | 'info'; full?: boolean }

function QuickActionCard({ label, tone, full }: QuickActionCardProps) {
  const toneBg: Record<'success' | 'warning' | 'info', string> = {
    success: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    warning: 'bg-amber-50 border-amber-100 text-amber-700',
    info: 'bg-sky-50 border-sky-100 text-sky-700',
  }
  return (
    <button
      type="button"
      className={`rounded-2xl border px-3 py-3 text-xs font-semibold text-left hover:bg-white transition-colors ${
        toneBg[tone]
      } ${full ? 'sm:col-span-2' : ''}`}
    >
      {label}
    </button>
  )
}

function SectionHeader({ title }: { title: string }) {
  return <h2 className="text-sm font-semibold text-slate-800 mb-2">{title}</h2>
}

// --- REVENUE PROTECTION VIEW ---

function RevenueProtectionView() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Potential tamper cases" value="24" sub="Monitored today" tone="warning" />
        <KpiCard title="Investigations open" value="12" sub="In progress" tone="info" />
        <KpiCard title="Recovered revenue" value="₦1.8M" sub="This month" tone="success" />
        <KpiCard title="Cases escalated" value="125" sub="Last 30 days" tone="danger" />
      </div>

      <Card className="overflow-hidden">
        <SectionHeader title="Tamper & Bypass Alerts" />
        <div className="overflow-auto">
          <table className="min-w-full text-xs text-slate-600">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 text-left font-medium">Customer</th>
                <th className="px-3 py-2 text-left font-medium">Meter ID</th>
                <th className="px-3 py-2 text-left font-medium">Zone</th>
                <th className="px-3 py-2 text-left font-medium">Issue</th>
                <th className="px-3 py-2 text-left font-medium">Impact</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Favour Shola', 'MTR-98213', 'Zone A', 'Direct line bypass', '₦120,000', 'Open'],
                ['Emeka Nwachukwu', 'MTR-56789', 'Angels Zone', 'Load bypass', '₦82,000', 'Assigned'],
                ['Zainab Adekoya', 'MTR-66721', 'CBD', 'Reverse energy', '₦43,000', 'Queued'],
              ].map(([name, meter, zone, issue, impact, status]) => (
                <tr key={meter} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-medium text-slate-900">{name}</td>
                  <td className="px-3 py-2.5">{meter}</td>
                  <td className="px-3 py-2.5">{zone}</td>
                  <td className="px-3 py-2.5">{issue}</td>
                  <td className="px-3 py-2.5 font-semibold text-slate-900">{impact}</td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      {status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="h-56 flex flex-col justify-between">
          <SectionHeader title="Projected vs Recovered Revenue" />
          <div className="mt-2 flex-1 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xs text-slate-400">
            <span>Bar chart placeholder</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
            <span>Total projected: ₦400M</span>
            <span className="text-emerald-600 font-semibold">Recovered: ₦231M</span>
          </div>
        </Card>
        <Card className="h-56 flex flex-col justify-between">
          <SectionHeader title="Energy Supplied vs Losses" />
          <div className="mt-2 flex-1 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xs text-slate-400">
            <span>Area chart placeholder</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
            <span>Total supplied: 9,580 MWh</span>
            <span className="text-red-600 font-semibold">Losses: 1,430 MWh</span>
          </div>
        </Card>
      </div>
    </div>
  )
}

// --- CUSTOMER CRM VIEW ---

function CustomerCrmView() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total customers" value="24,582" sub="All active meters" tone="info" />
        <KpiCard title="Active" value="23,156" sub="Supplying power" tone="success" />
        <KpiCard title="Suspended" value="1,426" sub="Under review" tone="warning" />
        <KpiCard title="Outstanding debt" value="₦45.2M" sub="All accounts" tone="danger" />
      </div>

      <Card className="overflow-hidden">
        <SectionHeader title="Customer CRM" />
        <div className="overflow-auto">
          <table className="min-w-full text-xs text-slate-600">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 text-left font-medium">Customer</th>
                <th className="px-3 py-2 text-left font-medium">Meter ID</th>
                <th className="px-3 py-2 text-left font-medium">Zone</th>
                <th className="px-3 py-2 text-left font-medium">Type</th>
                <th className="px-3 py-2 text-left font-medium">Balance</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Adebayo Ogunlehi', 'MTR-98231', 'Ring road', 'Prepaid', '₦12,500', 'Active'],
                ['Zainab Adekoya', 'MTR-66721', 'CBD', 'Postpaid', '₦80,000', 'Suspended'],
                ['Chinedu Okafor', 'MTR-44811', 'Maitama', 'Prepaid', '₦2,400', 'Active'],
              ].map(([name, meter, zone, type, balance, status]) => (
                <tr key={meter} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-medium text-slate-900">{name}</td>
                  <td className="px-3 py-2.5">{meter}</td>
                  <td className="px-3 py-2.5">{zone}</td>
                  <td className="px-3 py-2.5">{type}</td>
                  <td className="px-3 py-2.5 font-semibold text-slate-900">{balance}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

