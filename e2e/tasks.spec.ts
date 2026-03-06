import { test, expect } from '@playwright/test';

// Auth state is pre-loaded via storageState from global-setup.ts
test.describe('Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForURL(/\/(tasks|login)/, { timeout: 10000 });
  });

  test('should display tasks page', async ({ page }) => {
    await expect(page).toHaveURL(/.*tasks/);
    await expect(page.getByRole('heading', { name: /tasks/i })).toBeVisible();
    await expect(page.getByTestId('add-task-button')).toBeVisible();
  });

  test('should open add task modal', async ({ page }) => {
    await expect(page).toHaveURL(/.*tasks/);
    await page.getByTestId('add-task-button').click();
    await expect(page.getByText(/add task/i)).toBeVisible();
    await expect(page.getByLabel(/title/i)).toBeVisible();
  });

  test('should add a new task', async ({ page }) => {
    await expect(page).toHaveURL(/.*tasks/);
    await page.getByTestId('add-task-button').click();
    
    await page.getByLabel(/title/i).fill('Test Task');
    await page.getByLabel(/description/i).fill('Test Description');
    
    await page.getByRole('button', { name: /add task/i }).click();
    
    await expect(page.getByText('Test Task')).toBeVisible();
  });
});
