import type { GlobalConfig } from 'payload'

import { isAdmin, isAdminField } from '@/access'
import { recalculatePrices } from '@/hooks/recalculatePrices'

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Налаштування',
  admin: { group: 'Налаштування' },
  access: { read: () => true, update: isAdmin },
  hooks: { afterChange: [recalculatePrices] },
  fields: [
    {
      name: 'shopName',
      label: 'Назва магазину',
      type: 'text',
      required: true,
      defaultValue: 'Ювелірні прикраси',
    },
    {
      name: 'instagramUsername',
      label: 'Instagram username',
      type: 'text',
      admin: { description: 'Без @, наприклад: my.jewelry' },
      validate: (value: string | null | undefined) =>
        !value || /^[a-zA-Z0-9._]{1,30}$/.test(value) || 'Лише латиниця, цифри, крапка та _',
    },
    {
      type: 'group',
      name: 'contacts',
      label: 'Контакти у футері',
      fields: [
        { name: 'phone', label: 'Телефон', type: 'text' },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'address', label: 'Адреса', type: 'text' },
        { name: 'legalInfo', label: 'Дані ФОП', type: 'textarea' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'markupPercent',
          label: 'Націнка, %',
          type: 'number',
          defaultValue: 0,
          min: 0,
          access: { read: isAdminField },
          admin: { description: 'До закупівельної ціни з прайсу' },
        },
        {
          name: 'roundTo',
          label: 'Округлення ціни вгору до, грн',
          type: 'number',
          defaultValue: 10,
          min: 1,
          access: { read: isAdminField },
        },
      ],
    },
    {
      type: 'group',
      name: 'analytics',
      label: 'Аналітика',
      fields: [
        {
          name: 'ga4Id',
          label: 'GA4 Measurement ID',
          type: 'text',
          admin: { placeholder: 'G-XXXXXXXXXX' },
        },
        { name: 'metaPixelId', label: 'Meta Pixel ID', type: 'text' },
      ],
    },
  ],
}
