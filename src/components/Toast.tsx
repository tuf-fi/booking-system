import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2 } from 'lucide-react'

type Notify = (message: string) => void

const ToastContext = createContext<Notify>(() => undefined)

export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<number>(0)

  const notify = useCallback<Notify>(text => {
    setMessage(text)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setMessage(null), 3200)
  }, [])

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
        {message && (
          <div className="glass-dark pointer-events-auto flex max-w-md items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold">
            <CheckCircle2 size={18} className="shrink-0 text-sun" />
            {message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}
