import type { ComponentType, ReactNode } from 'react'

interface AccountCardProps {
  icon: ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>
  title: string
  children: ReactNode
}

export function AccountCard({ icon: Icon, title, children }: AccountCardProps) {
  return (
    <section className="glass glass-data p-5 sm:p-6">
      <h3 className="flex items-center gap-2 text-base font-bold">
        <Icon size={16} className="text-primary" aria-hidden />
        {title}
      </h3>
      <div className="mt-4 space-y-1">{children}</div>
    </section>
  )
}
