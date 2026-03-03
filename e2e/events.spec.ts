import { test, expect } from '@playwright/test';

test.describe('Events', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email').fill('test@example.com');
    await page.getByTestId('login-password').fill('password123');
    await page.getByTestId('login-submit').click();
    await page.waitForURL('/dashboard');
    await page.goto('/events');
  });

  test('should display events page', async ({ page }) => {
    await expect(page.getByText(/events/i)).toBeVisible();
    await expect(page.getByTestId('add-event-button')).toBeVisible();
  });

  test('should open add event modal', async ({ page }) => {
    await page.getByTestId('add-event-button').click();
    await expect(page.getByText(/add new event/i)).toBeVisible();
    await expect(page.getByLabel(/title/i)).toBeVisible();
    await expect(page.getByLabel(/date/i)).toBeVisible();
  });

  test('should add a new event', async ({ page }) => {
    await page.getByTestId('add-event-button').click();
    
    await page.getByLabel(/title/i).fill('Test Event');
    await page.getByLabel(/description/i).fill('Test Description');
    await page.getByLabel(/date/i).fill('2024-12-31');
    await page.getByLabel(/time/i).fill('18:00');
    
    await page.getByRole('button', { name: /add event/i }).click();
    
    await expect(page.getByText('Test Event')).toBeVisible();
  });
});
