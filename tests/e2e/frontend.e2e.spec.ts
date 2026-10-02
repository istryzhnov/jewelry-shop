import { expect, test } from '@playwright/test'

// Relies on the sample catalog from `npm run seed`
// Interactive tests wait for network idle so clicks land after hydration
const PRODUCT = '/product/sribna-kabluchka-tonka-liniia'

test('homepage shows hero and ordering steps', async ({ page }) => {
  await page.goto('http://localhost:3000/')
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Як замовити' })).toBeVisible()
})

test('catalog lists products and filters by price', async ({ page }) => {
  await page.goto('http://localhost:3000/catalog?min=1000&max=2000&sort=price-asc')
  await expect(page.getByRole('heading', { level: 1, name: 'Каталог' })).toBeVisible()
  const prices = await page.locator('article p span.font-medium').allInnerTexts()
  const values = prices.map((p) => Number(p.replace(/\D/g, '')))
  expect(values.length).toBeGreaterThan(0)
  expect(values.every((v) => v >= 1000 && v <= 2000)).toBe(true)
  expect(values).toEqual([...values].sort((a, b) => a - b))
})

test('product page copies an order message for the chosen variant', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto(`http://localhost:3000${PRODUCT}`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'розмір 18' }).click()
  await expect(page.getByText('Артикул: RG-001-18')).toBeVisible()

  await page.getByRole('button', { name: 'Замовити в Instagram' }).click()
  await expect(page.getByRole('status')).toContainText('скопійовано')
  const clipboard = await page.evaluate(() => navigator.clipboard.readText())
  expect(clipboard).toContain('арт. RG-001-18')
})

test('favorites persist across pages', async ({ page }) => {
  await page.goto(`http://localhost:3000${PRODUCT}`, { waitUntil: 'networkidle' })
  await page.locator('main').getByRole('button', { name: 'Додати в улюблене' }).first().click()
  await page.goto('http://localhost:3000/favorites')
  await expect(page.locator('article h3')).toContainText(['Срібна каблучка «Тонка лінія»'])
})

test('unknown product shows the 404 page', async ({ page }) => {
  const res = await page.goto('http://localhost:3000/product/does-not-exist')
  expect(res?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'Сторінку не знайдено' })).toBeVisible()
})
