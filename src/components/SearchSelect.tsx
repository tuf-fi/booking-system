import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export const FIELD_SHELL = 'relative rounded-control lg:rounded-full bg-ink/[0.045] transition-colors focus-within:bg-ink/[0.07] has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-primary lg:bg-transparent lg:hover:bg-ink/[0.045] lg:focus-within:bg-ink/[0.06]'
export const FIELD_PAD = 'block w-full px-3.5 py-2 text-left lg:px-5 lg:py-1.5'
export const FIELD_LABEL = 'block text-xs font-bold uppercase leading-4 tracking-[0.1em] text-muted'
export const FIELD_VALUE = 'block h-6 w-full truncate text-base font-semibold leading-6 text-ink'

export interface SelectOption {
  value: string
  label: string
  hint?: string
}

interface Props {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  className?: string
}

const MENU_ROW_HEIGHT = 40

export function SearchSelect({ label, value, options, onChange, className = '' }: Props) {
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [opensUp, setOpensUp] = useState(true)
  const [active, setActive] = useState(0)

  const selectedIndex = Math.max(0, options.findIndex(option => option.value === value))
  const selected = options[selectedIndex]

  const openMenu = useCallback(() => {
    const rect = rootRef.current?.getBoundingClientRect()
    if (rect) {
      const needed = options.length * MENU_ROW_HEIGHT + 24
      const below = window.innerHeight - rect.bottom
      setOpensUp(below < needed && rect.top > below)
    }
    setActive(selectedIndex)
    setOpen(true)
  }, [options.length, selectedIndex])

  const choose = (index: number) => {
    onChange(options[index].value)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault()
        openMenu()
      }
      return
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActive(current => Math.min(options.length - 1, current + 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        setActive(current => Math.max(0, current - 1))
        break
      case 'Home':
        event.preventDefault()
        setActive(0)
        break
      case 'End':
        event.preventDefault()
        setActive(options.length - 1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        choose(active)
        break
      case 'Escape':
        event.preventDefault()
        setOpen(false)
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  const listId = `${id}-list`

  return (
    <div ref={rootRef} className={`${FIELD_SHELL} ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        aria-label={`${label}: ${selected.label}`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={`${FIELD_PAD} pr-9 outline-none`}
      >
        <span className={FIELD_LABEL}>{label}</span>
        <span className={FIELD_VALUE}>{selected.label}</span>
        <ChevronDown size={15} aria-hidden className={`pointer-events-none absolute right-3.5 top-1/2 mt-0.5 -translate-y-1/2 text-muted transition-transform duration-200 lg:right-4 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className={`menu-pop absolute left-0 z-50 w-full min-w-56 overflow-hidden rounded-card border border-line bg-surface p-1.5 shadow-lift lg:w-max ${opensUp ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top'}`}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value
            return (
              <li
                key={option.value}
                id={`${id}-opt-${index}`}
                role="option"
                aria-selected={isSelected}
                onPointerEnter={() => setActive(index)}
                onClick={() => choose(index)}
                className={`flex h-10 cursor-pointer items-center justify-between gap-6 rounded-control px-3 text-sm font-semibold transition-colors ${index === active ? 'bg-ink/[0.06]' : ''} ${isSelected ? 'text-ink' : 'text-ink/80'}`}
              >
                <span className="flex items-center gap-2">
                  <Check size={14} aria-hidden className={isSelected ? 'text-primary' : 'invisible'} />
                  {option.label}
                </span>
                {option.hint && <span className="text-xs font-medium text-muted">{option.hint}</span>}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
