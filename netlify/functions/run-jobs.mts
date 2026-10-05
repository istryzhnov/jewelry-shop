import type { Config } from '@netlify/functions'

// Scheduled functions may run ~30s; each tick is a separate short request
const BUDGET_MS = 20_000

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
