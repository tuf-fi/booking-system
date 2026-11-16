import { photoSrc, photoSrcSet, photos } from '../data/photos'

interface PhotoProps {
  name: string
  size?: 'card' | 'full'
  sizes?: string
  className?: string
  priority?: boolean
}

export function Photo({ name, size = 'card', sizes, className, priority = false }: PhotoProps) {
  const photo = photos[name]
  const dims = photo[size]
  return (
    <img
      src={photoSrc(name, size)}
      srcSet={size === 'full' ? undefined : photoSrcSet(name)}
      sizes={sizes}
      width={dims.width}
      height={dims.height}
      alt={photo.alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
      className={className}
    />
  )
}
