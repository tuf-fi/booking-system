import { useEffect, useRef, useState } from 'react'


function useSeenOnce<T extends Element>() {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return [ref, seen] as const
}

function after(ms: number) {
  return { transitionDelay: `${ms}ms` }
}

const rise = 'translate-y-3 opacity-0 transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-data-[seen=true]/timeline:translate-y-0 group-data-[seen=true]/timeline:opacity-100'
const pop = 'scale-0 transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-data-[seen=true]/timeline:scale-100'

type Props = {
  downPaymentPercent: number
  cancellationDays: number
}

export function PolicyTimeline({ downPaymentPercent, cancellationDays }: Props) {
  const [ref, seen] = useSeenOnce<HTMLDivElement>()

  const steps = [
    ['When you book', `Pay ${downPaymentPercent}% by GCash or card to hold your room.`],
    [`${cancellationDays} days before check-in`, 'Last day to cancel free and get your down payment back in full. After this, it is not refunded.'],
    ['Check-in', 'Pay the rest when you arrive.']
  ]

  return (
    <div ref={ref} data-seen={seen} className="group/timeline mt-14">
      <div className="hidden md:block">
        <div className="relative h-5 text-sm font-semibold text-muted">
          <span className={`absolute left-0 ${rise}`} style={after(0)}>{steps[0][0]}</span>
          <span className={`absolute left-2/3 -translate-x-1/2 whitespace-nowrap ${rise}`} style={after(700)}>{steps[1][0]}</span>
          <span className={`absolute right-0 ${rise}`} style={after(1100)}>{steps[2][0]}</span>
        </div>

        <div className="relative mt-4">
          <div className="grid grid-cols-[2fr_1fr] gap-1">
            <span
              className={`h-0.5 origin-left scale-x-0 rounded-full bg-leaf transition duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-data-[seen=true]/timeline:scale-x-100`}
              style={after(100)}
            />
            <span
              className={`h-0.5 origin-left scale-x-0 rounded-full bg-line transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-data-[seen=true]/timeline:scale-x-100`}
              style={after(900)}
            />
          </div>
          <span aria-hidden className={`absolute left-0 top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-ink ring-4 ring-paper ${pop}`} style={after(0)} />
          <span aria-hidden className={`absolute left-2/3 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink ring-4 ring-paper ${pop}`} style={after(700)} />
          <span aria-hidden className={`absolute right-0 top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-ink ring-4 ring-paper ${pop}`} style={after(1100)} />
        </div>

        <div className="mt-9 grid grid-cols-[2fr_1fr] gap-x-10">
          <div className={rise} style={after(350)}>
            <p className="text-lg font-extrabold text-leaf-deep">Free cancellation</p>
            <p className="mt-2 max-w-md text-pretty text-[0.9375rem] leading-[1.7] text-muted">
              Pay {downPaymentPercent}% by GCash or card to hold your room. Cancel up to {cancellationDays} days before check-in and we refund it in full.
            </p>
          </div>
          <div className={rise} style={after(950)}>
            <p className="text-lg font-extrabold">Not refunded</p>
            <p className="mt-2 max-w-xs text-pretty text-[0.9375rem] leading-[1.7] text-muted">
              Cancel later than that and the down payment is not refunded. You pay the rest when you arrive.
            </p>
          </div>
        </div>
      </div>

      <ol className="relative space-y-8 pl-8 md:hidden">
        <span
          aria-hidden
          className={`absolute bottom-2 left-[4.5px] top-2 w-px origin-top scale-y-0 rounded-full bg-line transition duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-data-[seen=true]/timeline:scale-y-100`}
        />
        {steps.map(([title, text], index) => (
          <li key={title} className="relative">
            <span aria-hidden className={`absolute -left-8 top-1.5 size-2.5 rounded-full bg-ink ring-4 ring-paper ${pop}`} style={after(index * 350)} />
            <div className={rise} style={after(index * 350 + 150)}>
              <p className="text-base font-bold">{title}</p>
              <p className="mt-1 text-[0.9375rem] leading-[1.7] text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
