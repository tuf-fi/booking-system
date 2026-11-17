import type { ReactNode } from 'react'

type Props = {
  id: string
  title: ReactNode
  description?: string
  as?: 'h2' | 'h3'
  size?: 'md' | 'lg'
  tone?: 'default' | 'light'
  className?: string
}

const SIZES = {
  md: 'text-2xl sm:text-3xl',
  lg: 'text-3xl sm:text-4xl'
}

export function SectionHeading({ id, title, description, as: Tag = 'h2', size = 'md', tone = 'default', className = '' }: Props) {
  const light = tone === 'light'
  return (
    <div className={className}>
      <Tag id={id} className={`text-balance font-extrabold leading-tight ${SIZES[size]} ${light ? 'text-white' : ''}`}>{title}</Tag>
      {description && <p className={`mt-3 max-w-md text-pretty text-base leading-[1.7] ${light ? 'text-white/80' : 'text-muted'}`}>{description}</p>}
    </div>
  )
}
