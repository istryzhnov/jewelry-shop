import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

test.describe('Admin Panel', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('can navigate to dashboard', async () => {
    await page.goto('http://localhost:3000/admin')
    await expect(page).toHaveURL('http://localhost:3000/admin')
    const dashboardArtifact = page.locator('span[title="Головна"]').first()
    await expect(dashboardArtifact).toBeVisible()
  })

  test('can navigate to list view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users')
    await expect(page).toHaveURL('http://localhost:3000/admin/collections/users')
    const listViewArtifact = page.locator('h1', { hasText: 'Адміністратори' }).first()
    await expect(listViewArtifact).toBeVisible()
  })

  test('can navigate to edit view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users/create')
    await expect(page).toHaveURL(/\/admin\/collections\/users\/[a-zA-Z0-9-_]+/)
    const editViewArtifact = page.locator('input[name="email"]')
    await expect(editViewArtifact).toBeVisible()
  })

  test('shows seeded products with variant labels', async () => {
    // Cold dev compilation can exceed 30s
    test.setTimeout(120_000)
    await page.goto('http://localhost:3000/admin/collections/products?search=Тонка')
    await expect(page.locator('h1', { hasText: 'Товари' }).first()).toBeVisible()

    // The list view rewrites its URL after hydration and cancels earlier clicks
    await page.waitForURL(/limit=/)
    await page.getByRole('link', { name: 'Срібна каблучка «Тонка лінія»' }).click()
    await page.waitForURL(/\/admin\/collections\/products\/\d+/, { timeout: 60_000 })
    await expect(page.locator('input[name="name"]')).toHaveValue('Срібна каблучка «Тонка лінія»')
    await expect(page.locator('input[name="slug"]')).toHaveValue('sribna-kabluchka-tonka-liniia')
    await expect(page.getByText('RG-001-16 · р. 16 · 890 грн')).toBeVisible()
  })
})
