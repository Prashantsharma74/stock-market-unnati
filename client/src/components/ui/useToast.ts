import { createContext, useContext } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

type PushToast = (message: string, tone?: ToastTone) => void

export const ToastContext = createContext<PushToast | null>(null)

export function useToast() {
  const push = useContext(ToastContext)
  if (!push) throw new Error('useToast must be used inside ToastProvider')
  return push
}
