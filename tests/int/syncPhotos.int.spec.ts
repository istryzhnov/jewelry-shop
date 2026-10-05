import { getPayload, Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { listFolderImages } from '@/import/drive'
import { syncAndRecordPhotos, syncProductPhotos } from '@/import/syncPhotos'
import config from '@/payload.config'
import { clearCatalog, seed } from '@/seed'

let payload: Payload
let productId: number
let folder: { id: string; name: string; mime: string }[] = []

const entry = (id: string, name: string, mime: string) =>
  `<div class="flip-entry" id="entry-${id}"><a href="https://drive.google.com/file/d/${id}/view">` +
  `<img src="https://drive-thirdparty.googleusercontent.com/16/type/${mime}" alt=""/>` +
  `<div class="flip-entry-title">${name}</div></a></div>`

const jpeg = await sharp({
  create: { width: 1000, height: 1000, channels: 3, background: '#d4b483' },
})
  .jpeg()
  .toBuffer()

const downloads: string[] = []

const fetcher = async (url: string) => {
  if (url.includes('embeddedfolderview')) {
    return new Response(folder.map((f) => entry(f.id, f.name, f.mime)).join(''), { status: 200 })
  }
  const id = url.match(/\/d\/([\w-]+)=/)![1]
  downloads.push(id)
  if (id.startsWith('broken')) return new Response('Not found', { status: 404 })
  return new Response(new Uint8Array(jpeg), {
    status: 200,
    headers: { 'content-type': 'image/jpeg' },
  })
}

describe('Google Drive photo sync', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await clearCatalog(payload)
    await seed(payload)
    const { docs } = await payload.find({ collection: 'categories', limit: 1 })
    const product = await payload.create({
      collection: 'products',
      data: {
        name: 'Каблучка з фото',
        slug: 'kabluchka-z-foto',
        status: 'draft',
        autoPublish: true,
        photoFolder: 'https://drive.google.com/drive/folders/FOLDER1?usp=sharing',
        category: docs[0].id,
        variants: [{ sku: 'PH-1', price: 100, quantity: 1 }],
      },
    })
    productId = product.id
  })

  afterAll(async () => {
    await clearCatalog(payload)
    await payload.delete({ collection: 'media', where: { id: { exists: true } } })
  })

  it('lists only images, sorted naturally', async () => {
    folder = [
      { id: 'b', name: 'IMG_10.jpg', mime: 'image/jpeg' },
      { id: 'sub', name: 'Архів', mime: 'application/vnd.google-apps.folder' },
      { id: 'a', name: 'IMG_9.heic', mime: 'image/heif' },
    ]
    expect(await listFolderImages('FOLDER1', fetcher)).toEqual([
      { id: 'a', name: 'IMG_9.heic' },
      { id: 'b', name: 'IMG_10.jpg' },
    ])
  })

  it('downloads folder photos and publishes an auto-publish draft', async () => {
    const result = await syncProductPhotos(payload, productId, { fetcher })
    expect(result).toEqual({ added: 2, removed: 0, published: true, failed: [] })

    const product = await payload.findByID({ collection: 'products', id: productId, depth: 1 })
    expect(product.status).toBe('published')
    expect(product.autoPublish).toBe(false)
    const images = product.images as { sourceId: string; alt: string; mimeType: string }[]
    expect(images.map((m) => m.sourceId)).toEqual(['a', 'b'])
    expect(images[0]).toMatchObject({ alt: 'Каблучка з фото', mimeType: 'image/webp' })
    const sizes = (images[0] as unknown as { sizes: Record<string, { mimeType: string }> }).sizes
    expect(sizes.thumbnail.mimeType).toBe('image/webp')
    expect(sizes.card.mimeType).toBe('image/webp')
  })

  it('skips already downloaded files, keeps manual photos and drops removed ones', async () => {
    const manual = await payload.create({
      collection: 'media',
      data: { alt: 'Ручне фото' },
      file: { data: jpeg, mimetype: 'image/jpeg', name: 'manual.jpg', size: jpeg.length },
    })
    const before = await payload.findByID({ collection: 'products', id: productId, depth: 0 })
    await payload.update({
      collection: 'products',
      id: productId,
      data: { images: [...(before.images as number[]), manual.id] },
    })

    folder = [
      { id: 'b', name: 'IMG_10.jpg', mime: 'image/jpeg' },
      { id: 'c', name: 'IMG_11.jpg', mime: 'image/jpeg' },
    ]
    downloads.length = 0
    const result = await syncProductPhotos(payload, productId, { fetcher })
    expect(result).toEqual({ added: 1, removed: 1, published: false, failed: [] })
    expect(downloads).toEqual(['c'])

    const product = await payload.findByID({ collection: 'products', id: productId, depth: 1 })
    const images = product.images as { sourceId?: string; alt: string }[]
    expect(images.map((m) => m.sourceId ?? m.alt)).toEqual(['b', 'c', 'Ручне фото'])
  })

  it('skips files Google refuses to serve and reports them', async () => {
    folder = [
      { id: 'b', name: 'IMG_10.jpg', mime: 'image/jpeg' },
      { id: 'broken1', name: 'IMG_12.jpg', mime: 'image/jpeg' },
    ]
    const result = await syncAndRecordPhotos(payload, productId, fetcher)
    expect(result.failed).toEqual(['IMG_12.jpg'])
    const product = await payload.findByID({ collection: 'products', id: productId, depth: 0 })
    expect(product.photoSyncError).toBe('Не вдалося завантажити: IMG_12.jpg')
    expect(product.images).toHaveLength(2)
  })

  it('fails when no photo in the folder can be downloaded', async () => {
    folder = [{ id: 'broken2', name: 'IMG_13.jpg', mime: 'image/jpeg' }]
    await expect(syncAndRecordPhotos(payload, productId, fetcher)).rejects.toThrow(/жодне фото/)
    const product = await payload.findByID({ collection: 'products', id: productId, depth: 0 })
    expect(product.photoSyncError).toMatch(/жодне фото/)
  })
})
