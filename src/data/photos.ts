import manifest from './photos.generated.json'
import type { Photo } from '../types'

export const photos = manifest as Record<string, Photo>

export type PhotoSize = 'card' | 'full'

export const photoSrc = (name: string, size: PhotoSize) => `${import.meta.env.BASE_URL}photos/${name}-${size}.webp`

export const photoSrcSet = (name: string) => `${photoSrc(name, 'card')} 640w, ${photoSrc(name, 'full')} 1600w`
