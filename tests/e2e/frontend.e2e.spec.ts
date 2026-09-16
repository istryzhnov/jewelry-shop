import { test, expect } from '@playwright/test'

test('homepage renders', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await expect(page).toHaveTitle(/Ювелірні прикраси/)
  await expect(page.locator('h1')).toHaveText('Каталог незабаром')
})
