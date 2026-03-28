type HeaderBarProps = {
  title: string
  subtitle?: string
  leftAction?: React.ReactNode
  rightAction?: React.ReactNode
  className?: string
}

export function HeaderBar({ title, subtitle, leftAction, rightAction, className = '' }: HeaderBarProps) {
  return (
    <header className={`sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-slate-100/80 ${className}`}>
      <div className="flex items-center justify-between py-3.5 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 min-w-0">
          {leftAction}
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight truncate">{title}</h1>
            {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
          </div>
        </div>
        {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
      </div>
    </header>
  )
}
