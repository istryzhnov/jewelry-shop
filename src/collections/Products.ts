import type {
  ArrayFieldValidation,
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  TextFieldSingleValidation,
} from 'payload'

import { isAdmin, isAdminField, publishedOrAdmin } from '@/access'
import { slug } from '@/fields/slug'
import { revalidateOnChange, revalidateOnDelete } from '@/hooks/revalidateStore'
import { status } from '@/fields/status'
import { retailPrice } from '@/utilities/pricing'

type Variant = {
  sku?: string | null
  costPrice?: number | null
  price?: number | null
  quantity?: number | null
  madeToOrder?: boolean | null
}

// SKU must be unique across all products (it is the key for xlsx import)
const validateSku: TextFieldSingleValidation = async (value, { req, id }) => {
  if (!value) return 'Вкажіть артикул'
  const { totalDocs } = await req.payload.count({
    collection: 'products',
    where: {
      'variants.sku': { equals: value },
      ...(id ? { id: { not_equals: id } } : {}),
    },
    req,
  })
  return totalDocs > 0 ? `Артикул ${value} вже використовується в іншому товарі` : true
}

// Variants with a supplier cost get their retail price from the markup in settings
const applyMarkup: CollectionBeforeValidateHook = async ({ data, req }) => {
  const variants: Variant[] | undefined = data?.variants
  if (!variants?.some((v) => typeof v.costPrice === 'number')) return data
  const pricing = await req.payload.findGlobal({ slug: 'settings', depth: 0, req })
  for (const v of variants) {
    if (typeof v.costPrice === 'number') v.price = retailPrice(v.costPrice, pricing)
  }
  return data
}

// Denormalized fields for catalog filtering and sorting
const computeCatalogFields: CollectionBeforeChangeHook = ({ data }) => {
  const variants: Variant[] = data.variants ?? []
  const prices = variants.map((v) => v.price).filter((p): p is number => typeof p === 'number')
  data.minPrice = prices.length ? Math.min(...prices) : null
  data.inStock = variants.some((v) => (v.quantity ?? 0) > 0)
  data.madeToOrder = variants.some((v) => v.madeToOrder)
  return data
}

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Товар', plural: 'Товари' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'minPrice', 'inStock', 'status'],
    listSearchableFields: ['name', 'variants.sku'],
    group: 'Каталог',
  },
  access: {
    read: publishedOrAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    afterChange: [revalidateOnChange],
    afterDelete: [revalidateOnDelete],
    beforeValidate: [applyMarkup],
    beforeChange: [computeCatalogFields],
  },
  fields: [
    { name: 'name', label: 'Назва', type: 'text', required: true },
    slug(),
    status,
    {
      name: 'category',
      label: 'Категорія',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'collection',
      label: 'Колекція',
      type: 'relationship',
      relationTo: 'product-collections',
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'isNew',
      label: 'Новинка',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'isUnique',
      label: 'Унікальний виріб',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Виріб в одному екземплярі' },
    },
    {
      name: 'images',
      label: 'Фото',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: { description: 'Перше фото — головне' },
    },
    {
      name: 'photoFolder',
      label: 'Папка з фото (Google Drive)',
      type: 'text',
      access: { read: isAdminField },
      admin: {
        description: 'Фото з публічної папки завантажуються автоматично. Ручні фото зберігаються.',
      },
    },
    {
      name: 'photoSyncError',
      label: 'Помилка завантаження фото',
      type: 'text',
      access: { read: isAdminField },
      admin: {
        readOnly: true,
        condition: (data) => Boolean(data?.photoSyncError),
      },
    },
    { name: 'description', label: 'Опис', type: 'richText' },
    {
      type: 'collapsible',
      label: 'Характеристики',
      fields: [
        {
          name: 'type',
          label: 'Тип виробу',
          type: 'select',
          index: true,
          options: [
            { label: 'Каблучка', value: 'ring' },
            { label: 'Сережки', value: 'earrings' },
            { label: 'Підвіска', value: 'pendant' },
            { label: 'Кольє', value: 'necklace' },
            { label: 'Ланцюжок', value: 'chain' },
            { label: 'Браслет', value: 'bracelet' },
            { label: 'Брошка', value: 'brooch' },
            { label: 'Комплект', value: 'set' },
            { label: 'Інше', value: 'other' },
          ],
        },
        { name: 'coating', label: 'Покриття', type: 'text' },
        {
          name: 'stones',
          label: 'Камені',
          type: 'array',
          labels: { singular: 'Камінь', plural: 'Камені' },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'stone', label: 'Камінь', type: 'text', required: true },
                { name: 'count', label: 'Кількість', type: 'number', min: 1 },
                { name: 'size', label: 'Розмір', type: 'text' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'variants',
      label: 'Варіанти',
      type: 'array',
      labels: { singular: 'Варіант', plural: 'Варіанти' },
      minRows: 1,
      required: true,
      admin: {
        initCollapsed: false,
        components: { RowLabel: '@/components/admin/VariantRowLabel' },
      },
      validate: ((value, { data }) => {
        const rows = (value as Variant[] | null) ?? []
        const skus = rows.map((r) => r.sku).filter(Boolean)
        const duplicate = skus.find((s, i) => skus.indexOf(s) !== i)
        if (duplicate) return `Артикул ${duplicate} повторюється`
        if (
          (data as { isUnique?: boolean })?.isUnique &&
          (rows.length !== 1 || (rows[0]?.quantity ?? 0) > 1)
        ) {
          return 'Унікальний виріб має один варіант з кількістю не більше 1'
        }
        return true
      }) as ArrayFieldValidation,
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'sku',
              label: 'Артикул (SKU)',
              type: 'text',
              required: true,
              index: true,
              validate: validateSku,
            },
            { name: 'size', label: 'Розмір', type: 'text' },
            {
              name: 'metal',
              label: 'Метал',
              type: 'select',
              options: [
                { label: 'Срібло', value: 'silver' },
                { label: 'Золото жовте', value: 'gold-yellow' },
                { label: 'Золото біле', value: 'gold-white' },
                { label: 'Золото рожеве', value: 'gold-rose' },
                { label: 'Платина', value: 'platinum' },
                { label: 'Ювелірна сталь', value: 'steel' },
                { label: 'Інше', value: 'other' },
              ],
            },
            { name: 'purity', label: 'Проба', type: 'text' },
            { name: 'weight', label: 'Вага, г', type: 'number', min: 0 },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'costPrice',
              label: 'Закупівельна, грн',
              type: 'number',
              min: 0,
              access: { read: isAdminField },
              admin: { description: 'Якщо вказана, ціна рахується з націнки в налаштуваннях' },
            },
            { name: 'price', label: 'Ціна, грн', type: 'number', required: true, min: 0 },
            { name: 'oldPrice', label: 'Стара ціна, грн', type: 'number', min: 0 },
            {
              name: 'quantity',
              label: 'Кількість',
              type: 'number',
              required: true,
              defaultValue: 0,
              min: 0,
            },
            {
              name: 'madeToOrder',
              label: 'Під замовлення',
              type: 'checkbox',
              defaultValue: false,
            },
          ],
        },
      ],
    },
    {
      name: 'minPrice',
      label: 'Ціна від',
      type: 'number',
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'inStock',
      label: 'В наявності',
      type: 'checkbox',
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'madeToOrder',
      label: 'Є під замовлення',
      type: 'checkbox',
      index: true,
      admin: { readOnly: true, hidden: true },
    },
    {
      type: 'collapsible',
      label: 'Імпорт',
      admin: { position: 'sidebar', initCollapsed: true },
      fields: [
        {
          name: 'importManaged',
          label: 'Керується прайсом',
          type: 'checkbox',
          defaultValue: false,
          access: { read: isAdminField },
          admin: { description: 'Ціну й категорію оновлює імпорт; назву та опис — ні' },
        },
        {
          name: 'autoPublish',
          label: 'Опублікувати, коли з’являться фото',
          type: 'checkbox',
          defaultValue: false,
          access: { read: isAdminField },
        },
        {
          name: 'archivedByImport',
          label: 'Знято з прайсу',
          type: 'checkbox',
          defaultValue: false,
          access: { read: isAdminField },
          admin: { readOnly: true },
        },
      ],
    },
  ],
}
