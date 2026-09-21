import type { CollectionConfig } from 'payload'

import { isAdmin, publishedOrAdmin } from '@/access'
import { slug } from '@/fields/slug'
import { status } from '@/fields/status'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Сторінка', plural: 'Сторінки' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    group: 'Контент',
  },
  access: {
    read: publishedOrAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'title', label: 'Заголовок', type: 'text', required: true },
    slug('title'),
    status,
    { name: 'content', label: 'Вміст', type: 'richText' },
  ],
}
