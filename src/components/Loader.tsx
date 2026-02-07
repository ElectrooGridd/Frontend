type LoaderProps = { size?: 'sm' | 'md' | 'lg'; className?: string }

const sizeMap = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }

export function Loader({ size = 'md', className = '' }: LoaderProps) {
  return (
    <div
      className={`inline-block border-2 border-primary/30 border-t-primary rounded-full animate-spin ${sizeMap[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}
