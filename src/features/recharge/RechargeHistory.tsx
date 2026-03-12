import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { SkeletonLoader } from '@/components/SkeletonLoader'
import { AlertBadge } from '@/components/AlertBadge'
import { rechargesService, koboToNaira, type RechargeTransaction } from '@/services/rechargesService'

const PAGE_SIZE = 20
const FILTERS = ['All', 'Debit', 'Credit', 'Pending'] as const
type FilterType = (typeof FILTERS)[number]

function formatNaira(n: number | undefined): string {
  if (n == null) return '₦0.00'
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(n)
}

function formatDate(s: string | undefined): string {
  if (!s) return '—'
  try {
    return new Date(s).toLocaleString('en-NG', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return s
  }
}

function statusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' {
  const s = status?.toLowerCase() ?? ''
  if (s === 'completed' || s === 'success') return 'success'
  if (s === 'pending' || s === 'payment_pending' || s === 'processing') return 'warning'
  if (s === 'failed') return 'danger'
  return 'info'
}

export function RechargeHistory() {
  const [recharges, setRecharges] = useState<RechargeTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('All')

  const loadPage = useCallback(async (off: number, append: boolean) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    setError(null)
    try {
      const data = await rechargesService.getMyRecharges({
        limit: PAGE_SIZE,
        offset: off,
      })
      setRecharges((prev) => (append ? [...prev, ...data] : data))
      setHasMore(data.length === PAGE_SIZE)
      setOffset(off + data.length)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    loadPage(0, false)
  }, [loadPage])

  const loadMore = () => {
    if (loadingMore || !hasMore) return
    loadPage(offset, true)
  }

  const filtered = recharges.filter((r) => {
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchRef = r.payment_reference?.toLowerCase().includes(q)
      const amountNaira = r.amount_kobo != null ? koboToNaira(r.amount_kobo) : undefined
      const matchAmount = formatNaira(amountNaira).toLowerCase().includes(q)
      const matchStatus = r.status?.toLowerCase().includes(q)
      if (!matchRef && !matchAmount && !matchStatus) return false
    }
    if (filter === 'Credit') return (r.status?.toLowerCase() ?? '').includes('completed') || (r.status?.toLowerCase() ?? '').includes('success')
    if (filter === 'Debit') return false
    if (filter === 'Pending') return (r.status?.toLowerCase() ?? '').includes('pending') || (r.status?.toLowerCase() ?? '').includes('processing')
    return true
  })

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <AlertBadge variant="danger" message={error} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-text-primary">Transaction History</h2>
        <Link to="/recharge">
          <Button>Recharge</Button>
        </Link>
      </div>

      <Input
        placeholder="Search transactions..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="rounded-card"
      />

      <div className="flex gap-2 overflow-x-auto pb-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`
              flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium
              ${filter === f ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'}
            `}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <Card>
          <SkeletonLoader lines={5} />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <p className="text-text-secondary text-center py-8">No transactions yet</p>
        </Card>
      ) : (
        <>
          <ul className="space-y-3">
            {filtered.map((r) => (
              <li key={r.id}>
                <Card padding="md" className="flex items-center gap-4">
                  <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg">
                    ⚡
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-primary">Electricity Purchase</p>
                    <p className="text-sm text-text-secondary">{formatDate(r.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-medium text-text-primary">{formatNaira(r.amount_kobo != null ? koboToNaira(r.amount_kobo) : undefined)}</p>
                    <span
                      className={`
                        text-xs font-medium
                        ${statusVariant(r.status) === 'success' ? 'text-success' : ''}
                        ${statusVariant(r.status) === 'warning' ? 'text-warning' : ''}
                        ${statusVariant(r.status) === 'danger' ? 'text-danger' : ''}
                        ${statusVariant(r.status) === 'info' ? 'text-primary' : ''}
                      `}
                    >
                      {r.status === 'completed' || (r.status ?? '').toLowerCase() === 'success' ? 'Successful' : r.status}
                    </span>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
          {hasMore && recharges.length === filtered.length && (
            <div className="flex justify-center pt-4">
              <Button variant="secondary" loading={loadingMore} disabled={loadingMore} onClick={loadMore}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
