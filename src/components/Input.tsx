import { type InputHTMLAttributes, forwardRef } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-primary mb-1">{label}</label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-card border bg-card
            text-text-primary placeholder:text-text-secondary
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'border-danger focus:ring-danger/50' : 'border-gray-300'}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
        {hint && !error && <p className="mt-1 text-sm text-text-secondary">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
