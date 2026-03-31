import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type Toast = { id: number; message: string; type?: 'success' | 'error' | 'info' }
type ToastContextValue = { show: (message: string, type?: Toast['type']) => void }

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within Toaster')
  return ctx
}

export function Toaster({ children }: { children?: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const show = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              rounded-card shadow-soft-md p-4 border
              ${t.type === 'success' ? 'bg-success/10 border-success/20 text-success' : ''}
              ${t.type === 'error' ? 'bg-danger/10 border-danger/20 text-danger' : ''}
              ${t.type === 'info' || !t.type ? 'bg-card border-gray-200 text-text-primary' : ''}
            `}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
