import { type HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({ padding = 'md', className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`bg-card rounded-card shadow-soft border border-gray-100 ${paddingMap[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
