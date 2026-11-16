export function Logo({ className = 'size-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#2F6B4F" />
      <path d="M5 24 15 8q1-1.5 2 0l10 16Z" fill="#FAF8F4" />
      <path d="M13.2 11.4q2.8 1.8 5.6 0L17 8q-1-1.5-2 0Z" fill="#F2B33D" />
    </svg>
  )
}
