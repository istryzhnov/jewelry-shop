import type { Payload } from 'payload'

import type { Product } from '@/payload-types'
import { richTextFromParagraphs } from '@/utilities/richText'
import { slugify } from '@/utilities/slugify'

type SeedProduct = Omit<
  Product,
  'id' | 'createdAt' | 'updatedAt' | 'category' | 'collection' | 'slug'
> & {
  category: string
  collection?: string
}

const categories = [
  { name: 'Каблучки' },
  { name: 'Обручки', parent: 'Каблучки' },
  { name: 'Сережки' },
  { name: 'Підвіски' },
  { name: 'Браслети' },
  { name: 'Ланцюжки' },
]

const collections = [{ name: 'Мінімалізм' }, { name: 'Квіти' }]

const products: SeedProduct[] = [
  {
    name: 'Срібна каблучка «Тонка лінія»',
    status: 'published',
    category: 'Каблучки',
    collection: 'Мінімалізм',
    type: 'ring',
    isNew: true,
    description: richTextFromParagraphs(['Тонка каблучка на кожен день.']),
    variants: [
      {
        sku: 'RG-001-16',
        size: '16',
        metal: 'silver',
        purity: '925',
        weight: 1.4,
        price: 890,
        quantity: 3,
      },
      {
        sku: 'RG-001-17',
        size: '17',
        metal: 'silver',
        purity: '925',
        weight: 1.5,
        price: 890,
        quantity: 0,
      },
      {
        sku: 'RG-001-18',
        size: '18',
        metal: 'silver',
        purity: '925',
        weight: 1.6,
        price: 890,
        quantity: 2,
      },
    ],
  },
  {
    name: 'Обручка класична',
    status: 'published',
    category: 'Обручки',
    type: 'ring',
    variants: [
      { sku: 'WR-010-S', size: '17', metal: 'silver', purity: '925', price: 1200, quantity: 5 },
      {
        sku: 'WR-010-G',
        size: '17',
        metal: 'gold-yellow',
        purity: '585',
        price: 8900,
        oldPrice: 9500,
        quantity: 1,
      },
    ],
  },
  {
    name: 'Сережки «Ромашка»',
    status: 'published',
    category: 'Сережки',
    collection: 'Квіти',
    type: 'earrings',
    stones: [{ stone: 'Фіаніт', count: 2, size: '3 мм' }],
    variants: [
      { sku: 'ER-020', metal: 'silver', purity: '925', weight: 2.1, price: 1150, quantity: 4 },
    ],
  },
  {
    name: 'Підвіска «Крапля» з топазом',
    status: 'published',
    category: 'Підвіски',
    type: 'pendant',
    isUnique: true,
    stones: [{ stone: 'Топаз блакитний', count: 1, size: '8×6 мм' }],
    variants: [
      { sku: 'PD-030', metal: 'gold-white', purity: '585', weight: 1.9, price: 7400, quantity: 1 },
    ],
  },
  {
    name: 'Браслет плетений',
    status: 'published',
    category: 'Браслети',
    type: 'bracelet',
    variants: [
      {
        sku: 'BR-040-17',
        size: '17 см',
        metal: 'silver',
        purity: '925',
        price: 1650,
        quantity: 0,
        madeToOrder: true,
      },
      {
        sku: 'BR-040-19',
        size: '19 см',
        metal: 'silver',
        purity: '925',
        price: 1750,
        quantity: 0,
        madeToOrder: true,
      },
    ],
  },
  {
    name: 'Ланцюжок якірний',
    status: 'draft',
    category: 'Ланцюжки',
    type: 'chain',
    variants: [
      { sku: 'CH-050-45', size: '45 см', metal: 'silver', purity: '925', price: 990, quantity: 6 },
      { sku: 'CH-050-50', size: '50 см', metal: 'silver', purity: '925', price: 1090, quantity: 6 },
    ],
  },
]

const pages = [
  { title: 'Про нас', text: 'Ми створюємо прикраси вручну.' },
  { title: 'Як замовити', text: 'Оберіть прикрасу та напишіть нам в Instagram Direct.' },
  {
    title: 'Доставка й оплата',
    text: 'Доставка Новою Поштою або Укрпоштою. Оплату узгоджуємо в Direct.',
  },
  { title: 'Догляд за прикрасами', text: 'Зберігайте прикраси окремо, у сухому місці.' },
]

export async function seed(payload: Payload) {
  const categoryIds = new Map<string, number>()
  for (const { name, parent } of categories) {
    const doc = await payload.create({
      collection: 'categories',
      data: { name, slug: slugify(name)!, parent: parent ? categoryIds.get(parent) : undefined },
    })
    categoryIds.set(name, doc.id)
  }

  const collectionIds = new Map<string, number>()
  for (const { name } of collections) {
    const doc = await payload.create({
      collection: 'product-collections',
      data: { name, slug: slugify(name)! },
    })
    collectionIds.set(name, doc.id)
  }

  for (const { category, collection, ...product } of products) {
    await payload.create({
      collection: 'products',
      data: {
        ...product,
        slug: slugify(product.name)!,
        category: categoryIds.get(category)!,
        collection: collection ? collectionIds.get(collection) : undefined,
      },
    })
  }

  for (const { title, text } of pages) {
    await payload.create({
      collection: 'pages',
      data: {
        title,
        slug: slugify(title)!,
        status: 'published',
        content: richTextFromParagraphs([text]),
      },
    })
  }

  await payload.updateGlobal({
    slug: 'homepage',
    data: {
      hero: { title: 'Прикраси ручної роботи', buttonText: 'До каталогу', buttonLink: '/catalog' },
      featuredCollections: [...collectionIds.values()],
    },
  })
}

export async function clearCatalog(payload: Payload) {
  for (const collection of ['products', 'pages', 'product-collections'] as const) {
    await payload.delete({ collection, where: { id: { exists: true } } })
  }
  // Children first: parent references block deletion
  await payload.delete({ collection: 'categories', where: { parent: { exists: true } } })
  await payload.delete({ collection: 'categories', where: { id: { exists: true } } })
}
