import { test, expect } from '@playwright/test';

// Auth state is pre-loaded via storageState from global-setup.ts
test.describe('Events', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/events');
    await page.waitForURL(/\/(events|login)/, { timeout: 10000 });
  });

  test('should display events page', async ({ page }) => {
    await expect(page).toHaveURL(/.*events/);
    await expect(page.getByText(/events/i)).toBeVisible();
    await expect(page.getByTestId('add-event-button')).toBeVisible();
  });

  test('should open add event modal', async ({ page }) => {
    await expect(page).toHaveURL(/.*events/);
    await page.getByTestId('add-event-button').click();
    await expect(page.getByText(/add new event/i)).toBeVisible();
    await expect(page.getByLabel(/title/i)).toBeVisible();
    await expect(page.getByLabel(/date/i)).toBeVisible();
  });

  test('should add a new event', async ({ page }) => {
    await expect(page).toHaveURL(/.*events/);
    await page.getByTestId('add-event-button').click();
    
    await page.getByLabel(/title/i).fill('Test Event');
    await page.getByLabel(/description/i).fill('Test Description');
    await page.getByLabel(/date/i).fill('2024-12-31');
    await page.getByLabel(/time/i).fill('18:00');
    
    await page.getByRole('button', { name: /add event/i }).click();
    
    await expect(page.getByText('Test Event')).toBeVisible();
  });
});
