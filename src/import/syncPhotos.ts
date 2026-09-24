import type { Payload, PayloadRequest } from 'payload'

import { downloadImage, type Fetcher, folderIdFromUrl, listFolderImages } from './drive'

const MAX_PHOTOS = 10

export type PhotoSyncResult = {
  added: number
  removed: number
  published: boolean
  failed: string[]
}

// Mirrors a product's Drive folder into its images; manually uploaded photos are kept after them
export async function syncProductPhotos(
  payload: Payload,
  productId: number,
  { fetcher = fetch, req }: { fetcher?: Fetcher; req?: Partial<PayloadRequest> } = {},
): Promise<PhotoSyncResult> {
  const product = await payload.findByID({ collection: 'products', id: productId, depth: 0, req })
  const folderId = product.photoFolder ? folderIdFromUrl(product.photoFolder) : null
  if (!folderId) throw new Error('у товару немає посилання на папку Google Drive')

  const folderImages = (await listFolderImages(folderId, fetcher)).slice(0, MAX_PHOTOS)
  const currentIds = (product.images ?? []).map((m) => (typeof m === 'object' ? m.id : m))
  const { docs: current } = currentIds.length
    ? await payload.find({
        collection: 'media',
        where: { id: { in: currentIds } },
        pagination: false,
        depth: 0,
        req,
      })
    : { docs: [] }

  const bySource = new Map(current.filter((m) => m.sourceId).map((m) => [m.sourceId!, m.id]))
  const manual = currentIds.filter((id) => !current.find((m) => m.id === id)?.sourceId)

  const synced: number[] = []
  const failed: string[] = []
  let added = 0
  for (const [index, image] of folderImages.entries()) {
    const existing = bySource.get(image.id)
    if (existing) {
      synced.push(existing)
      continue
    }
    // A single broken file in the folder must not block the rest
    const data = await downloadImage(image.id, fetcher).catch(() => null)
    if (!data) {
      failed.push(image.name)
      continue
    }
    const media = await payload.create({
      collection: 'media',
      data: { alt: product.name, sourceId: image.id },
      file: {
        data,
        mimetype: 'image/jpeg',
        name: `${product.slug}-${index + 1}.jpg`,
        size: data.length,
      },
      req,
    })
    synced.push(media.id)
    added++
  }

  if (folderImages.length && !synced.length) {
    throw new Error(`жодне фото не вдалося завантажити (${failed.join(', ')})`)
  }

  const stale = [...bySource.entries()].filter(
    ([source]) => !folderImages.some((i) => i.id === source),
  )
  const images = [...synced, ...manual]
  const publish = Boolean(product.autoPublish && images.length && product.status === 'draft')

  await payload.update({
    collection: 'products',
    id: productId,
    data: { images, ...(publish ? { status: 'published', autoPublish: false } : {}) },
    req,
  })
  if (stale.length) {
    await payload.delete({
      collection: 'media',
      where: { id: { in: stale.map(([, id]) => id) } },
      req,
    })
  }
  return { added, removed: stale.length, published: publish, failed }
}

// Runs the sync and stores the outcome on the product so admins see broken folders/files
export async function syncAndRecordPhotos(payload: Payload, productId: number, fetcher?: Fetcher) {
  const record = (photoSyncError: string | null) =>
    payload.update({ collection: 'products', id: productId, data: { photoSyncError } })
  try {
    const result = await syncProductPhotos(payload, productId, { fetcher })
    await record(
      result.failed.length ? `Не вдалося завантажити: ${result.failed.join(', ')}` : null,
    )
    return result
  } catch (err) {
    await record(err instanceof Error ? err.message : String(err))
    throw err
  }
}
