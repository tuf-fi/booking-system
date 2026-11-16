import { Star } from 'lucide-react'
import { REVIEWS, REVIEWS_ARE_SAMPLES } from '../data/reviews'

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5 text-sun" aria-hidden>
      {[1, 2, 3, 4, 5].map(n => <Star key={n} size={14} fill={n <= Math.round(value) ? 'currentColor' : 'none'} strokeWidth={1.5} />)}
    </span>
  )
}

export function RoomReviews({ roomId }: { roomId: string }) {
  const reviews = REVIEWS[roomId] ?? []
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

  return (
    <section aria-labelledby="reviews-h">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id="reviews-h" className="text-lg font-bold">Guest reviews</h3>
        {reviews.length > 0 && (
          <p className="flex items-center gap-2 text-[0.8125rem] text-muted">
            <Stars value={average} />
            <span><b className="text-ink">{average.toFixed(1)}</b> from {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
          </p>
        )}
      </div>
      {REVIEWS_ARE_SAMPLES && reviews.length > 0 && (
        <p className="mt-1.5 text-xs font-bold uppercase tracking-wide text-sun-ink">Sample reviews for the demo</p>
      )}
      {reviews.length === 0 ? (
        <p className="mt-3 text-[0.9375rem] text-muted">No reviews yet for this room.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {reviews.map(review => (
            <li key={review.name} className="py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.9375rem] font-bold">{review.name}</p>
                <Stars value={review.rating} />
              </div>
              <p className="text-xs text-muted">Stayed {review.stayed}</p>
              <p className="mt-2 max-w-prose text-pretty text-[0.9375rem] leading-[1.7] text-muted">{review.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
