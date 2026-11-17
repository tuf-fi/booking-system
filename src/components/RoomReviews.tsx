import { useState } from 'react'
import { Star } from 'lucide-react'
import { REVIEWS, REVIEWS_ARE_SAMPLES } from '../data/reviews'
import { Pagination } from './Pagination'

const PAGE_SIZE = 4

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5 text-accent" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(n => <Star key={n} size={14} fill={n <= Math.round(value) ? 'currentColor' : 'none'} strokeWidth={1.5} aria-hidden />)}
    </span>
  )
}

export function RoomReviews({ roomId }: { roomId: string }) {
  const reviews = REVIEWS[roomId] ?? []
  const [page, setPage] = useState(1)
  const visible = reviews.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

  return (
    <section aria-labelledby="reviews-h" className="border-t border-line pt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 id="reviews-h" className="font-display text-xl font-extrabold leading-tight">Guest reviews</h3>
        {reviews.length > 0 && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Stars value={average} />
            <span><b className="text-ink">{average.toFixed(1)}</b> from {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
          </p>
        )}
      </div>
      {REVIEWS_ARE_SAMPLES && reviews.length > 0 && <p className="mt-1 text-xs text-muted">Sample reviews for the demo</p>}
      {reviews.length === 0 ? (
        <p className="mt-5 text-base text-muted">No reviews yet for this room.</p>
      ) : (
        <ul className="mt-6 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {visible.map(review => (
            <li key={review.name}>
              <Stars value={review.rating} />
              <p className="mt-3 text-pretty text-base leading-[1.65] text-ink">{review.text}</p>
              <p className="mt-3 text-sm text-muted"><b className="font-bold text-ink">{review.name}</b> · Stayed {review.stayed}</p>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={reviews.length} onChange={setPage} />
    </section>
  )
}
