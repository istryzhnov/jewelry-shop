import ExcelJS from 'exceljs'
import { getPayload, Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { IMPORT_BATCH, QUEUES } from '@/jobs'
import config from '@/payload.config'
import { clearCatalog } from '@/seed'

let payload: Payload

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

// More rows than one batch, so the chained batch jobs are exercised
async function priceList(count: number) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Лист1')
  ws.getRow(1).values = ['Каблучки']
  ws.getRow(2).values = ['Арт', 'Ціна', 'Фото посилання']
  for (let i = 0; i < count; i++) ws.getRow(i + 3).values = [`R${1000 + i}`.slice(1), 500 + i]
  ws.getRow(count + 3).values = ['Шпилька', 300]
  return Buffer.from(await wb.xlsx.writeBuffer())
}

describe('import run (admin flow)', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await clearCatalog(payload)
    await payload.delete({ collection: 'import-runs', where: { id: { exists: true } } })
  })

  afterAll(async () => {
    await payload.delete({ collection: 'import-runs', where: { id: { exists: true } } })
    await clearCatalog(payload)
  })

  it('builds a dry-run report on upload and applies it through batch jobs', async () => {
    const count = IMPORT_BATCH + 5
    const data = await priceList(count)
    const run = await payload.create({
      collection: 'import-runs',
      data: {},
      file: { data, mimetype: XLSX, name: 'prais.xlsx', size: data.length },
    })

    expect(run.status).toBe('preview')
    const report = run.report as { total: number; create: string[]; issues: { message: string }[] }
    expect(report.total).toBe(count)
    expect(report.create).toHaveLength(count)
    expect(report.issues[0].message).toMatch(/Шпилька/)
    expect(await payload.count({ collection: 'products' })).toMatchObject({ totalDocs: 0 })

    await payload.jobs.queue({
      task: 'importRows',
      input: { runId: run.id, offset: 0 },
      queue: QUEUES.import,
    })
    for (let i = 0; i < 5; i++) {
      const { noJobsRemaining } = await payload.jobs.run({
        queue: QUEUES.import,
        limit: 1,
        sequential: true,
      })
      if (noJobsRemaining) break
    }

    const done = await payload.findByID({ collection: 'import-runs', id: run.id })
    expect(done.status).toBe('done')
    expect(done.processed).toBe(count)
    expect(done.results).toMatchObject({ created: count, errors: [] })
    expect(await payload.count({ collection: 'products' })).toMatchObject({ totalDocs: count })
  })
})
