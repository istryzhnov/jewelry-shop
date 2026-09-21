import type { GlobalConfig } from 'payload'

import { isAdmin } from '@/access'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Головна сторінка',
  admin: { group: 'Контент' },
  access: { read: () => true, update: isAdmin },
  fields: [
    {
      type: 'group',
      name: 'hero',
      label: 'Банер',
      fields: [
        { name: 'title', label: 'Заголовок', type: 'text' },
        { name: 'subtitle', label: 'Підзаголовок', type: 'textarea' },
        { name: 'image', label: 'Зображення', type: 'upload', relationTo: 'media' },
        { name: 'buttonText', label: 'Текст кнопки', type: 'text' },
        {
          name: 'buttonLink',
          label: 'Посилання кнопки',
          type: 'text',
          admin: { placeholder: '/catalog' },
        },
      ],
    },
    {
      name: 'featuredCollections',
      label: 'Вибрані колекції',
      type: 'relationship',
      relationTo: 'product-collections',
      hasMany: true,
    },
    {
      name: 'newArrivalsCount',
      label: 'Кількість новинок на головній',
      type: 'number',
      defaultValue: 8,
      min: 0,
      max: 24,
    },
  ],
}
