import type { Endpoint } from 'payload'

import { QUEUES, releaseStaleJobs } from '.'

// Called by the Netlify scheduled function; import jobs go before photo jobs
export const jobsTick: Endpoint = {
  path: '/jobs/tick',
  method: 'post',
  handler: async (req) => {
    const secret = process.env.CRON_SECRET
    const authorized =
      Boolean(req.user) ||
      Boolean(secret && req.headers.get('authorization') === `Bearer ${secret}`)
    if (!authorized) return Response.json({ message: 'Unauthorized' }, { status: 401 })

    await releaseStaleJobs(req.payload)
    const run = (queue: string) => req.payload.jobs.run({ queue, limit: 1, sequential: true })
    const imports = await run(QUEUES.import)
    if (!imports.noJobsRemaining) return Response.json({ noJobsRemaining: false })
    const photos = await run(QUEUES.photos)
    return Response.json({ noJobsRemaining: Boolean(photos.noJobsRemaining) })
  },
}
