import type { Payload, PayloadRequest } from 'payload'

import type { Product } from '@/payload-types'

import type { PriceListRow } from './parsePriceList'

export type RowResult = 'created' | 'updated' | 'unchanged' | 'conflict'

export type ImportPlan = {
  create: string[]
  update: { sku: string; changes: string[] }[]
  unchanged: number
  conflicts: string[]
  archive: string[]
}

type Taxonomy = 'categories' | 'product-collections'

// Caches category/collection ids by their price-list name for one import pass
export class TaxonomyCache {
  private maps = {
    categories: { ids: new Map<string, number>(), names: new Map<number, string>() },
    'product-collections': { ids: new Map<string, number>(), names: new Map<number, string>() },
  }

  constructor(
    private payload: Payload,
    private req?: Partial<PayloadRequest>,
  ) {}

  async load() {
    for (const collection of ['categories', 'product-collections'] as const) {
      const { docs } = await this.payload.find({
        collection,
        pagination: false,
        depth: 0,
        req: this.req,
      })
      for (const doc of docs) this.remember(collection, doc.importName || doc.name, doc.id)
    }
    return this
  }

  private remember(collection: Taxonomy, name: string, id: number) {
    this.maps[collection].ids.set(name, id)
    this.maps[collection].names.set(id, name)
  }

  nameOf(collection: Taxonomy, ref: number | { id: number } | null | undefined) {
    const id = typeof ref === 'object' ? ref?.id : ref
    return id ? this.maps[collection].names.get(id) : undefined
  }

  async resolve(collection: Taxonomy, name: string): Promise<number> {
    const cached = this.maps[collection].ids.get(name)
    if (cached) return cached
    const doc = await this.payload.create({
      collection,
      data: { name, importName: name } as never,
      req: this.req,
    })
    this.remember(collection, name, doc.id)
    return doc.id
  }
}

type ExistingProduct = Pick<
  Product,
  | 'id'
  | 'variants'
  | 'category'
  | 'collection'
  | 'photoFolder'
  | 'importManaged'
  | 'archivedByImport'
  | 'images'
  | 'status'
>

const SELECT = {
  variants: true,
  category: true,
  collection: true,
  photoFolder: true,
  importManaged: true,
  archivedByImport: true,
  images: true,
  status: true,
} as const

function diff(existing: ExistingProduct, row: PriceListRow, taxonomy: TaxonomyCache): string[] {
  const variant = existing.variants.find((v) => v.sku === row.sku)
  const changes: string[] = []
  if (variant?.costPrice !== row.costPrice)
    changes.push(`ціна ${variant?.costPrice ?? '—'} → ${row.costPrice}`)
  if ((variant?.size ?? undefined) !== row.size) changes.push('розмір')
  if (taxonomy.nameOf('categories', existing.category as number) !== row.category)
    changes.push('категорія')
  if (taxonomy.nameOf('product-collections', existing.collection as number) !== row.collection)
    changes.push('колекція')
  if (row.photoFolder && existing.photoFolder !== row.photoFolder) changes.push('папка з фото')
  if (existing.archivedByImport) changes.push('повернено в прайс')
  return changes
}

async function loadProductsBySku(payload: Payload, req?: Partial<PayloadRequest>) {
  const { docs } = await payload.find({
    collection: 'products',
    pagination: false,
    depth: 0,
    select: SELECT,
    req,
  })
  const bySku = new Map<string, ExistingProduct>()
  for (const doc of docs as ExistingProduct[]) for (const v of doc.variants) bySku.set(v.sku, doc)
  return { bySku, all: docs as ExistingProduct[] }
}

// Dry run: what applying these rows would change
export async function planImport(payload: Payload, rows: PriceListRow[]): Promise<ImportPlan> {
  const taxonomy = await new TaxonomyCache(payload).load()
  const { bySku, all } = await loadProductsBySku(payload)
  const plan: ImportPlan = { create: [], update: [], unchanged: 0, conflicts: [], archive: [] }
  const inFile = new Set(rows.map((r) => r.sku))

  for (const row of rows) {
    const existing = bySku.get(row.sku)
    if (!existing) plan.create.push(row.sku)
    else if (!existing.importManaged) plan.conflicts.push(row.sku)
    else {
      const changes = diff(existing, row, taxonomy)
      if (changes.length) plan.update.push({ sku: row.sku, changes })
      else plan.unchanged++
    }
  }
  for (const product of all) {
    if (
      product.importManaged &&
      !product.archivedByImport &&
      !product.variants.some((v) => inFile.has(v.sku))
    ) {
      plan.archive.push(product.variants.map((v) => v.sku).join(', '))
    }
  }
  return plan
}

export type UpsertResult = { result: RowResult; productId?: number; needsPhotos: boolean }

export async function upsertRow(
  payload: Payload,
  row: PriceListRow,
  taxonomy: TaxonomyCache,
  req?: Partial<PayloadRequest>,
): Promise<UpsertResult> {
  const { docs } = await payload.find({
    collection: 'products',
    where: { 'variants.sku': { equals: row.sku } },
    depth: 0,
    limit: 1,
    select: SELECT,
    req,
  })
  const existing = docs[0] as ExistingProduct | undefined
  const category = await taxonomy.resolve('categories', row.category)
  const collection = row.collection
    ? await taxonomy.resolve('product-collections', row.collection)
    : null

  if (!existing) {
    const created = await payload.create({
      collection: 'products',
      data: {
        name: row.name,
        slug: row.slug,
        status: 'draft',
        type: row.type,
        category,
        collection,
        photoFolder: row.photoFolder,
        importManaged: true,
        autoPublish: Boolean(row.photoFolder),
        variants: [
          { sku: row.sku, size: row.size, costPrice: row.costPrice, price: 0, quantity: 1 },
        ],
      },
      req,
    })
    return { result: 'created', productId: created.id, needsPhotos: Boolean(row.photoFolder) }
  }

  if (!existing.importManaged)
    return { result: 'conflict', productId: existing.id, needsPhotos: false }

  const changes = diff(existing, row, taxonomy)
  const hasImages = Boolean(existing.images?.length)
  const needsPhotos = Boolean(
    row.photoFolder && (existing.photoFolder !== row.photoFolder || !hasImages),
  )
  if (!changes.length) return { result: 'unchanged', productId: existing.id, needsPhotos }

  await payload.update({
    collection: 'products',
    id: existing.id,
    data: {
      category,
      collection,
      ...(row.photoFolder ? { photoFolder: row.photoFolder } : {}),
      variants: existing.variants.map((v) =>
        v.sku === row.sku ? { ...v, costPrice: row.costPrice, size: row.size ?? null } : v,
      ),
      ...(existing.archivedByImport
        ? { archivedByImport: false, status: hasImages ? 'published' : 'draft' }
        : {}),
    },
    req,
  })
  return { result: 'updated', productId: existing.id, needsPhotos }
}

// Products that came from the price list but are no longer in it leave the site
export async function archiveMissing(
  payload: Payload,
  skus: Set<string>,
  req?: Partial<PayloadRequest>,
) {
  const { all } = await loadProductsBySku(payload, req)
  let archived = 0
  for (const product of all) {
    if (!product.importManaged || product.archivedByImport) continue
    if (product.variants.some((v) => skus.has(v.sku))) continue
    await payload.update({
      collection: 'products',
      id: product.id,
      data: { status: 'archived', archivedByImport: true },
      req,
    })
    archived++
  }
  return archived
}
