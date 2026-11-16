import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}

const pageItems = (page: number, pages: number): (number | 'gap')[] => {
  const wanted = new Set([1, pages, page - 1, page, page + 1])
  const sorted = [...wanted].filter(n => n >= 1 && n <= pages).sort((a, b) => a - b)
  const items: (number | 'gap')[] = []
  sorted.forEach((n, index) => {
    if (index > 0 && n - sorted[index - 1] > 1) items.push('gap')
    items.push(n)
  })
  return items
}

const BUTTON = 'grid size-9 place-items-center text-[0.8125rem] font-bold transition-colors duration-200'

export function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages <= 1) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)

  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-col items-center gap-3">
      <p className="order-2 text-xs text-muted">Showing {from}–{to} of {total}</p>
      <ul className="order-1 flex items-center gap-1">
        <li>
          <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Previous page" className={`${BUTTON} text-ink hover:bg-sand disabled:cursor-not-allowed disabled:text-muted/50 disabled:hover:bg-transparent`}>
            <ChevronLeft size={16} aria-hidden />
          </button>
        </li>
        {pageItems(page, pages).map((item, index) =>
          item === 'gap' ? (
            <li key={`gap-${index}`} aria-hidden className="grid size-9 place-items-center text-muted">…</li>
          ) : (
            <li key={item}>
              <button type="button" onClick={() => onChange(item)} aria-current={item === page ? 'page' : undefined} aria-label={`Page ${item}`} className={`${BUTTON} tabular-nums ${item === page ? 'bg-ink text-white' : 'text-muted hover:bg-sand hover:text-ink'}`}>
                {item}
              </button>
            </li>
          )
        )}
        <li>
          <button type="button" onClick={() => onChange(page + 1)} disabled={page === pages} aria-label="Next page" className={`${BUTTON} text-ink hover:bg-sand disabled:cursor-not-allowed disabled:text-muted/50 disabled:hover:bg-transparent`}>
            <ChevronRight size={16} aria-hidden />
          </button>
        </li>
      </ul>
    </nav>
  )
}
