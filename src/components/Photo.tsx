import { photoSrc, photoSrcSet, photos } from '../data/photos'
import { useDb } from '../store/db'

interface PhotoProps {
  name: string
  size?: 'card' | 'full'
  sizes?: string
  className?: string
  priority?: boolean
  alt?: string
}

export function Photo({ name, size = 'card', sizes, className, priority = false, alt }: PhotoProps) {
  const db = useDb()
  if (name.startsWith('upload:')) {
    const src = db.uploads?.[name.slice(7)]
    if (!src) return <div className={`bg-sand ${className ?? ''}`} aria-hidden />
    return <img src={src} alt={alt ?? ''} loading={priority ? 'eager' : 'lazy'} decoding="async" className={className} />
  }
  const photo = photos[name]
  if (!photo) return <div className={`bg-sand ${className ?? ''}`} aria-hidden />
  const dims = photo[size]
  return (
    <img
      src={photoSrc(name, size)}
      srcSet={size === 'full' ? undefined : photoSrcSet(name)}
      sizes={sizes}
      width={dims.width}
      height={dims.height}
      alt={alt ?? photo.alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
      className={className}
    />
  )
}
