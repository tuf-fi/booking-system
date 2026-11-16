import type { ReactNode } from 'react'
import { toast, Toaster } from 'sonner'

type Kind = 'success' | 'warning' | 'error'

type Notify = (message: string, kind?: Kind) => void

const notify: Notify = (message, kind = 'success') => {
  toast[kind](message)
}

export const useToast = () => notify

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster theme="light" position="bottom-center" />
    </>
  )
}
