import type { CollectionConfig, RelationshipFieldSingleValidation } from 'payload'

import { isAdmin } from '@/access'
import { slug } from '@/fields/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Категорія', plural: 'Категорії' },
  orderable: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'parent', 'slug'],
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
    {
      name: 'parent',
      label: 'Батьківська категорія',
      type: 'relationship',
      relationTo: 'categories',
      admin: { position: 'sidebar' },
      // Two levels max: a parent must itself be top-level
      filterOptions: ({ id }) => ({
        parent: { exists: false },
        ...(id ? { id: { not_equals: id } } : {}),
      }),
      validate: (async (value, { req, id }) => {
        if (!value) return true
        const ref = value as number | { id?: number; value?: number }
        const parentId = typeof ref === 'object' ? (ref.id ?? ref.value) : ref
        if (!parentId) return true
        if (parentId === id) return 'Категорія не може бути власним батьком'
        const parent = await req.payload.findByID({
          collection: 'categories',
          id: parentId,
          depth: 0,
          req,
        })
        return parent?.parent ? 'Дозволено лише два рівні вкладеності' : true
      }) as RelationshipFieldSingleValidation,
    },
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
