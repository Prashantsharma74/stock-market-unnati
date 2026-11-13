import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { ToastContext, type ToastTone } from './useToast.ts'

type ToastItem = {
  id: number
  message: string
  tone: ToastTone
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const push = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 4200)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-20 right-4 z-50 flex w-[min(100%-2rem,22rem)] flex-col gap-2 lg:bottom-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto animate-rise rounded-2xl px-4 py-3 text-sm font-medium shadow-lg ring-1 ${
              toast.tone === 'error'
                ? 'bg-rose-50 text-rose-800 ring-rose-200'
                : toast.tone === 'success'
                  ? 'bg-gain/10 text-gain ring-gain/20'
                  : 'bg-white text-navy-900 ring-slate-200'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
