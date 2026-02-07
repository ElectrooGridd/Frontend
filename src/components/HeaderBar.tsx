type HeaderBarProps = {
  title: string
  subtitle?: string
  leftAction?: React.ReactNode
  rightAction?: React.ReactNode
  className?: string
}

export function HeaderBar({ title, subtitle, leftAction, rightAction, className = '' }: HeaderBarProps) {
  return (
    <header className={`flex items-center justify-between py-4 px-4 sm:px-6 ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {leftAction}
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-text-primary truncate">{title}</h1>
          {subtitle && <p className="text-sm text-text-secondary truncate">{subtitle}</p>}
        </div>
      </div>
      {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
    </header>
  )
}
