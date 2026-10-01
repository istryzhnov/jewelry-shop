import type { Product } from '@/payload-types'

type Variant = Product['variants'][number]

export const METAL_LABELS: Record<NonNullable<Variant['metal']>, string> = {
  silver: 'Срібло',
  'gold-yellow': 'Золото жовте',
  'gold-white': 'Золото біле',
  'gold-rose': 'Золото рожеве',
  platinum: 'Платина',
  steel: 'Ювелірна сталь',
  other: 'Інше',
}

export const TYPE_LABELS: Record<NonNullable<Product['type']>, string> = {
  ring: 'Каблучка',
  earrings: 'Сережки',
  pendant: 'Підвіска',
  necklace: 'Кольє',
  chain: 'Ланцюжок',
  bracelet: 'Браслет',
  brooch: 'Брошка',
  set: 'Комплект',
  other: 'Прикраса',
}

export const variantLabel = (v: Pick<Variant, 'size' | 'metal' | 'purity'>) =>
  [v.size && `розмір ${v.size}`, v.metal && METAL_LABELS[v.metal], v.purity && `проба ${v.purity}`]
    .filter(Boolean)
    .join(', ')
