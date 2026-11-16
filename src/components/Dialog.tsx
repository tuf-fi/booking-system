import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const WIDTHS = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }

export function Dialog({ open, onClose, title, children, size = 'sm' }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={event => {
        if (event.target === ref.current) onClose()
      }}
      aria-label={title}
      className={`m-auto w-[calc(100%-2rem)] ${WIDTHS[size]} max-h-[90vh] overflow-y-auto glass-strong rounded-3xl p-0 text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-sm`}
    >
      {open && (
        <div className="p-6 sm:p-7">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 className="text-2xl font-bold">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 -mt-1 grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-sand">
              <X size={20} />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}
