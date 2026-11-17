import type { ReactNode } from 'react'

type Props = {
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-4xl font-extrabold">{title}</h1>
        {description && <p className="mt-1 max-w-xl text-muted">{description}</p>}
      </div>
      {actions}
    </div>
  )
}
