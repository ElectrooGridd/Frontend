type Variant = 'info' | 'success' | 'warning' | 'danger'

type AlertBadgeProps = {
  variant?: Variant
  title?: string
  message: string
  className?: string
}

const variantStyles: Record<Variant, string> = {
  info: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
}

export function AlertBadge({ variant = 'info', title, message, className = '' }: AlertBadgeProps) {
  return (
    <div
      className={`rounded-card border p-4 ${variantStyles[variant]} ${className}`}
      role="alert"
    >
      {title && <p className="font-medium mb-0.5">{title}</p>}
      <p className="text-sm opacity-90">{message}</p>
    </div>
  )
}
