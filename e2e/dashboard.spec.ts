import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByTestId('login-email').fill('test@example.com');
    await page.getByTestId('login-password').fill('password123');
    await page.getByTestId('login-submit').click();
    await page.waitForURL('/dashboard');
  });

  test('should display dashboard with stats', async ({ page }) => {
    await expect(page.getByText(/welcome back/i)).toBeVisible();
    await expect(page.getByText(/active goals/i)).toBeVisible();
    await expect(page.getByText(/budget status/i)).toBeVisible();
    await expect(page.getByText(/upcoming events/i)).toBeVisible();
    await expect(page.getByText(/pending tasks/i)).toBeVisible();
  });

  test('should navigate to goals page', async ({ page }) => {
    await page.getByText(/goals/i).first().click();
    await expect(page).toHaveURL(/.*goals/);
    await expect(page.getByText(/goals/i)).toBeVisible();
  });

  test('should navigate to events page', async ({ page }) => {
    await page.getByText(/events/i).first().click();
    await expect(page).toHaveURL(/.*events/);
    await expect(page.getByText(/events/i)).toBeVisible();
  });

  test('should navigate to tasks page', async ({ page }) => {
    await page.getByText(/tasks/i).first().click();
    await expect(page).toHaveURL(/.*tasks/);
    await expect(page.getByText(/tasks/i)).toBeVisible();
  });

  test('should navigate to budgets page', async ({ page }) => {
    await page.getByText(/budgets/i).first().click();
    await expect(page).toHaveURL(/.*budgets/);
    await expect(page.getByText(/budgets/i)).toBeVisible();
  });
});
