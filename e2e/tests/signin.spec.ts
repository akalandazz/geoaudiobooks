import { test, expect } from '@playwright/test';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
const TEST_EMAIL = 'e2e-signin@example.com';
const TEST_PASSWORD = 'TestPassword123!';

test.beforeAll(async ({ request }) => {
  await request.post(`${BACKEND_URL}/auth/signup`, {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD, name: 'E2E Test User' },
  });
  // Ignore error if user already exists
});

test('sign in with valid credentials', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('you@example.com').fill(TEST_EMAIL);
  await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByPlaceholder('you@example.com')).not.toBeVisible({ timeout: 10000 });
});

test('sign in with invalid credentials shows error', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('you@example.com').fill(TEST_EMAIL);
  await page.getByPlaceholder('••••••••').fill('wrongpassword');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.locator('text=/invalid credentials/i')).toBeVisible({ timeout: 5000 });
});
