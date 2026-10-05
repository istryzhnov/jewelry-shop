import { expect, test, type Page } from '@playwright/test'
import { getPayload } from 'payload'

import config from '../../src/payload.config.js'

const PRODUCT = 'http://localhost:3000/product/sribna-kabluchka-tonka-liniia'
let previous: { ga4Id?: string | null; metaPixelId?: string | null } = {}

const recorded = (page: Page) =>
  page.evaluate(() => ({
    ga: (window.dataLayer ?? []).map((a) => String(Array.from(a as ArrayLike<unknown>)[1])),
    fb: ((window.fbq as unknown as { queue?: unknown[][] })?.queue ?? []).map((a) => String(a[1])),
  }))

test.describe('analytics with consent', () => {
  test.beforeAll(async () => {
    const payload = await getPayload({ config })
    previous = (await payload.findGlobal({ slug: 'settings' })).analytics ?? {}
    await payload.updateGlobal({
      slug: 'settings',
      data: { analytics: { ga4Id: 'G-TEST123', metaPixelId: '1234567890' } },
    })
  })

  test.afterAll(async () => {
    const payload = await getPayload({ config })
    await payload.updateGlobal({ slug: 'settings', data: { analytics: previous } })
  })

  test.beforeEach(async ({ context }) => {
    // Tags never reach Google/Meta from tests
    await context.route(/googletagmanager|facebook\.net|google-analytics/, (route) => route.abort())
  })

  test('loads nothing before consent', async ({ page }) => {
    const external: string[] = []
    page.on('request', (r) => /googletagmanager|facebook/.test(r.url()) && external.push(r.url()))
    await page.goto(PRODUCT, { waitUntil: 'networkidle' })
    await expect(page.getByRole('dialog', { name: 'Згода на cookie' })).toBeVisible()
    expect(await page.evaluate(() => typeof window.gtag)).toBe('undefined')
    expect(external).toEqual([])
  })

  test('sends page and lead events to GA4 and Pixel after consent', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto(PRODUCT, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Прийняти' }).click()
    await expect.poll(async () => (await recorded(page)).ga).toContain('view_item')

    const events = await recorded(page)
    expect(events.ga.filter((e) => e === 'view_item')).toHaveLength(1)
    expect(events.fb).toEqual(expect.arrayContaining(['1234567890', 'PageView', 'ViewContent']))

    await page.getByRole('button', { name: 'Замовити в Instagram' }).click()
    await expect.poll(async () => (await recorded(page)).ga).toContain('generate_lead')
    expect((await recorded(page)).fb).toContain('Contact')
  })

  test('respects a refusal', async ({ page }) => {
    await page.goto('http://localhost:3000/catalog', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Лише необхідні' }).click()
    await page.reload({ waitUntil: 'networkidle' })
    await expect(page.getByRole('dialog', { name: 'Згода на cookie' })).toHaveCount(0)
    expect(await page.evaluate(() => typeof window.gtag)).toBe('undefined')
  })
})
