import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access'
import { slug } from '@/fields/slug'
import { revalidateOnChange, revalidateOnDelete } from '@/hooks/revalidateStore'

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
  hooks: { afterChange: [revalidateOnChange], afterDelete: [revalidateOnDelete] },
  fields: [
    { name: 'name', label: 'Назва', type: 'text', required: true },
    slug(),
    {
      name: 'importName',
      label: 'Назва в прайсі',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
        description: 'За цією назвою імпорт знаходить запис, тож саму назву можна змінювати',
      },
    },
    { name: 'description', label: 'Опис', type: 'textarea' },
    { name: 'image', label: 'Зображення', type: 'upload', relationTo: 'media' },
  ],
}
