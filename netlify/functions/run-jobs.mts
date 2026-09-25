import type { Config } from '@netlify/functions'

// Scheduled functions may run ~30s; each call to the job runner is a separate short request
const BUDGET_MS = 20_000

// Drains Payload's job queue (price-list import batches, photo downloads) every minute
const runJobs = async () => {
  const deadline = Date.now() + BUDGET_MS
  while (Date.now() < deadline) {
    const res = await fetch(`${process.env.URL}/api/jobs/tick`, {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok || body.noJobsRemaining) {
      console.log('payload jobs:', res.status, JSON.stringify(body))
      break
    }
  }
}

export default runJobs

export const config: Config = { schedule: '* * * * *' }
