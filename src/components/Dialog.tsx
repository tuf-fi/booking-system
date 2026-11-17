import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'xs' | 'sm' | 'md' | 'lg'
  headerAction?: ReactNode
}

const WIDTHS = { xs: 'max-w-sm', sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }

export function Dialog({ open, onClose, title, children, size = 'sm', headerAction }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      dialog.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={event => { if (event.target === event.currentTarget) onClose() }}
      onClick={event => {
        if (event.target === ref.current) onClose()
      }}
      aria-label={title}
      tabIndex={-1}
      className={`m-auto w-[calc(100%-2rem)] ${WIDTHS[size]} max-h-[90vh] overflow-y-auto glass-strong rounded-panel border-white/80 p-0 text-ink outline-none [--glass-a1:0.86] [--glass-a2:0.74] shadow-[0_30px_80px_-20px_rgb(22_35_29/0.45)] backdrop:bg-ink/25 backdrop:backdrop-blur-[6px]`}
    >
      {open && (
        <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold leading-tight">{title}</h2>
            <div className="-mr-2 flex items-center gap-1">
              {headerAction}
              <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-sand focus-visible:bg-sand focus-visible:outline-none">
                <X size={18} />
              </button>
            </div>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
