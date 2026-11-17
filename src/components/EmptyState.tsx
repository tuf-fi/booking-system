import type { ReactNode } from 'react'

type Props = {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className = '' }: Props) {
  return (
    <div className={`p-10 text-center ${className}`}>
      <p className="font-display text-lg font-bold">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-sm text-base text-muted">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}
