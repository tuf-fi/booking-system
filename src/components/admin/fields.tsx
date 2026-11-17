export const LABEL = 'mb-1.5 block text-xs font-semibold text-muted'
export const INPUT = 'block h-10 w-full rounded-control border border-ink/10 bg-ink/[0.045] px-3 text-sm font-semibold tabular-nums text-ink outline-none transition-[background-color,border-color,box-shadow] placeholder:font-normal hover:bg-ink/[0.07] focus:border-primary focus:bg-white/60 focus:shadow-[0_0_0_3px_var(--color-primary-tint)]'
export const TEXTAREA = 'block min-h-24 w-full resize-y rounded-control border border-ink/10 bg-ink/[0.045] px-3 py-2.5 text-sm font-medium leading-relaxed text-ink outline-none transition-[background-color,border-color,box-shadow] placeholder:font-normal hover:bg-ink/[0.07] focus:border-primary focus:bg-white/60 focus:shadow-[0_0_0_3px_var(--color-primary-tint)]'

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <span className="relative inline-flex h-5 w-9 shrink-0">
      <input type="checkbox" role="switch" aria-label={label} className="peer sr-only" checked={checked} onChange={event => onChange(event.target.checked)} />
      <span aria-hidden className="absolute inset-0 rounded-full bg-ink/20 transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary" />
      <span aria-hidden className="absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
    </span>
  )
}

export function PesoField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className={LABEL} htmlFor={id}>{label}</label>
      <div className="relative">
        <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">₱</span>
        <input id={id} type="number" min="0" inputMode="numeric" className={`${INPUT} pl-7`} value={value} onChange={event => onChange(event.target.value)} />
      </div>
    </div>
  )
}

export function NumberField({ id, label, suffix, min = 0, max, value, onChange }: { id: string; label: string; suffix?: string; min?: number; max?: number; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className={LABEL} htmlFor={id}>{label}</label>
      <div className="relative">
        <input id={id} type="number" min={min} max={max} inputMode="numeric" className={`${INPUT} ${suffix ? (suffix.length > 2 ? 'pr-28' : 'pr-9') : ''}`} value={value} onChange={event => onChange(event.target.value)} />
        {suffix && <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{suffix}</span>}
      </div>
    </div>
  )
}

export function TextField({ id, label, value, onChange, placeholder, type = 'text' }: { id: string; label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className={LABEL} htmlFor={id}>{label}</label>
      <input id={id} type={type} className={INPUT} value={value} placeholder={placeholder} onChange={event => onChange(event.target.value)} />
    </div>
  )
}
