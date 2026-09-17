import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access'
import { slug } from '@/fields/slug'

export const ProductCollections: CollectionConfig = {
  slug: 'product-collections',
  labels: { singular: 'Колекція', plural: 'Колекції' },
  orderable: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug'],
    group: 'Каталог',
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', label: 'Назва', type: 'text', required: true },
    slug(),
    { name: 'description', label: 'Опис', type: 'textarea' },
    { name: 'image', label: 'Зображення', type: 'upload', relationTo: 'media' },
  ],
}
