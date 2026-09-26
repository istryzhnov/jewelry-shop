import { sql, type PostgresAdapter } from '@payloadcms/db-postgres'
import { getPayload, Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { releaseStaleJobs } from '@/jobs'
import config from '@/payload.config'

let payload: Payload

describe('job recovery', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  afterAll(async () => {
    await payload.delete({ collection: 'payload-jobs', where: { id: { exists: true } } })
  })

  it('releases jobs stuck in processing after an interrupted run', async () => {
    const stuck = await payload.jobs.queue({ task: 'syncPhotos', input: { productId: 1 } })
    const fresh = await payload.jobs.queue({ task: 'syncPhotos', input: { productId: 2 } })
    const db = (payload.db as unknown as PostgresAdapter).drizzle
    await db.execute(
      sql`UPDATE payload_jobs SET processing = true, updated_at = now() - interval '10 minutes' WHERE id = ${stuck.id}`,
    )
    await db.execute(sql`UPDATE payload_jobs SET processing = true WHERE id = ${fresh.id}`)

    await releaseStaleJobs(payload)

    const jobs = await payload.find({
      collection: 'payload-jobs',
      where: { id: { in: [stuck.id, fresh.id] } },
    })
    const processing = Object.fromEntries(jobs.docs.map((j) => [j.id, j.processing]))
    expect(processing[stuck.id]).toBe(false)
    expect(processing[fresh.id]).toBe(true)
  })
})
