import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Медіафайл', plural: 'Медіа' },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      label: 'Альтернативний текст',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    mimeTypes: ['image/*'],
    formatOptions: { format: 'webp', options: { quality: 82 } },
    imageSizes: [
      { name: 'thumbnail', width: 400 },
      { name: 'card', width: 800 },
      { name: 'large', width: 1600 },
    ],
  },
}
