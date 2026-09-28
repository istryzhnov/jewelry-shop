import type { Media, Product } from '@/payload-types'

export const firstImage = (images: Product['images'] | undefined): Media | null => {
  const first = images?.[0]
  return first && typeof first === 'object' ? first : null
}
