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
    {
      name: 'sourceId',
      label: 'ID файлу в Google Drive',
      type: 'text',
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
  upload: {
    mimeTypes: ['image/*'],
    // Original doubles as the large image on product pages; every size is WebP to keep pages light
    resizeOptions: { width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true },
    formatOptions: { format: 'webp', options: { quality: 80 } },
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        formatOptions: { format: 'webp', options: { quality: 75 } },
      },
      { name: 'card', width: 800, formatOptions: { format: 'webp', options: { quality: 78 } } },
    ],
  },
}
