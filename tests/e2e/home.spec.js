import { test, expect } from '@playwright/test';

test('home page renders the storefront heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'ESK Packaging' })).toBeVisible();
});
