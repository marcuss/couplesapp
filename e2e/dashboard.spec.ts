import { test, expect } from '@playwright/test';

// Auth state is pre-loaded via storageState from global-setup.ts
// If the test user session is valid, we go directly to /dashboard

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    // If not authenticated, ProtectedRoute redirects to /login
    // In that case tests will fail — ensure E2E_TEST_EMAIL/PASSWORD are configured
    await page.waitForURL(/\/(dashboard|login)/, { timeout: 10000 });
  });

  test('should display dashboard with stats', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText(/welcome back/i)).toBeVisible();
  });

  test('should navigate to goals page', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);
    await page.getByRole('link', { name: /goals/i }).first().click();
    await expect(page).toHaveURL(/.*goals/);
  });

  test('should navigate to events page', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);
    await page.getByRole('link', { name: /events/i }).first().click();
    await expect(page).toHaveURL(/.*events/);
  });

  test('should navigate to tasks page', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);
    await page.getByRole('link', { name: /tasks/i }).first().click();
    await expect(page).toHaveURL(/.*tasks/);
  });

  test('should navigate to budgets page', async ({ page }) => {
    await expect(page).toHaveURL(/.*dashboard/);
    await page.getByRole('link', { name: /budgets/i }).first().click();
    await expect(page).toHaveURL(/.*budgets/);
  });
});
