type SkeletonLoaderProps = {
  className?: string
  lines?: number
}

export function SkeletonLoader({ className = '', lines = 3 }: SkeletonLoaderProps) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 rounded"
          style={{ width: i === lines - 1 && lines > 1 ? '75%' : '100%' }}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-card rounded-card shadow-soft p-5 animate-pulse ${className}`}>
      <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-8 bg-gray-200 rounded w-2/3 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  )
}

export function SkeletonChart({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-card rounded-card shadow-soft p-5 animate-pulse ${className}`}>
      <div className="h-5 bg-gray-200 rounded w-1/4 mb-4" />
      <div className="h-40 flex items-end gap-2">
        {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
          <div key={i} className="flex-1 bg-gray-200 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}
