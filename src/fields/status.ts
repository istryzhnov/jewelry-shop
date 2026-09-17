import type { SelectField } from 'payload'

export const status: SelectField = {
  name: 'status',
  label: 'Статус',
  type: 'select',
  required: true,
  defaultValue: 'draft',
  index: true,
  options: [
    { label: 'Чернетка', value: 'draft' },
    { label: 'Опубліковано', value: 'published' },
    { label: 'Архів', value: 'archived' },
  ],
  admin: { position: 'sidebar' },
}
