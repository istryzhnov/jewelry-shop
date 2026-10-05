import type { Payload, TaskConfig } from 'payload'

import { archiveMissing, TaxonomyCache, upsertRow } from '@/import/applyImport'
import type { PriceListRow } from '@/import/parsePriceList'
import { syncAndRecordPhotos } from '@/import/syncPhotos'

export const IMPORT_BATCH = 200

// Photo downloads must not hold up catalog updates
export const QUEUES = { import: 'import', photos: 'photos' } as const
const JOB_BUDGET_MS = 7000

export type ImportResults = {
  created: number
  updated: number
  unchanged: number
  conflict: number
  archived: number
  photosQueued: number
  errors: { sku: string; message: string }[]
}

export const emptyResults = (): ImportResults => ({
  created: 0,
  updated: 0,
  unchanged: 0,
  conflict: 0,
  archived: 0,
  photosQueued: 0,
  errors: [],
})

// Each job queues the next one, so batches run strictly in order
export const importRowsTask: TaskConfig<'importRows'> = {
  slug: 'importRows',
  label: 'Імпорт прайсу: пакет рядків',
  retries: 2,
  inputSchema: [
    { name: 'runId', type: 'number', required: true },
    { name: 'offset', type: 'number', required: true },
  ],
  handler: async ({ input, req }) => {
    const { payload } = req
    const run = await payload.findByID({ collection: 'import-runs', id: input.runId, depth: 0 })
    const rows = (run.rows ?? []) as PriceListRow[]
    const results = { ...emptyResults(), ...(run.results as ImportResults | null) }
    const taxonomy = await new TaxonomyCache(payload).load()

    const deadline = Date.now() + JOB_BUDGET_MS
    let next = input.offset
    for (const row of rows.slice(input.offset, input.offset + IMPORT_BATCH)) {
      if (Date.now() > deadline) break
      next++
      try {
        const { result, productId, needsPhotos } = await upsertRow(payload, row, taxonomy)
        results[result]++
        if (needsPhotos && productId) {
          await payload.jobs.queue({
            task: 'syncPhotos',
            input: { productId },
            queue: QUEUES.photos,
          })
          results.photosQueued++
        }
      } catch (err) {
        results.errors.push({
          sku: row.sku,
          message: err instanceof Error ? err.message : String(err),
        })
      }
    }

    const done = next >= rows.length
    if (done) results.archived = await archiveMissing(payload, new Set(rows.map((r) => r.sku)))
    else
      await payload.jobs.queue({
        task: 'importRows',
        input: { runId: input.runId, offset: next },
        queue: QUEUES.import,
      })

    await payload.update({
      collection: 'import-runs',
      id: input.runId,
      data: {
        results,
        processed: Math.min(next, rows.length),
        ...(done ? { status: 'done' } : {}),
      },
    })
    return { output: {} }
  },
}

export const syncPhotosTask: TaskConfig<'syncPhotos'> = {
  slug: 'syncPhotos',
  label: 'Фото товару з Google Drive',
  retries: 2,
  inputSchema: [{ name: 'productId', type: 'number', required: true }],
  handler: async ({ input, req }) => {
    await syncAndRecordPhotos(req.payload, input.productId)
    return { output: {} }
  },
}

const STALE_AFTER_MS = 5 * 60 * 1000

// Jobs killed by a timeout stay "processing" forever otherwise
export async function releaseStaleJobs(payload: Payload) {
  await payload.update({
    collection: 'payload-jobs',
    where: {
      processing: { equals: true },
      updatedAt: { less_than: new Date(Date.now() - STALE_AFTER_MS).toISOString() },
    },
    data: { processing: false },
  })
}
