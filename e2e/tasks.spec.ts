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
    await expect(page.getByRole('heading', { name: /add task/i })).toBeVisible();
    await expect(page.getByLabel(/title/i)).toBeVisible();
  });

  test('should add a new task', async ({ page }) => {
    await expect(page).toHaveURL(/.*tasks/);
    const uniqueTitle = `Test Task ${Date.now()}`;
    await page.getByTestId('add-task-button').click();
    
    await page.getByLabel(/title/i).fill(uniqueTitle);
    await page.getByLabel(/description/i).fill('Test Description');
    
    await page.locator('form').getByRole('button', { name: /add task/i }).click();
    
    await expect(page.getByText(uniqueTitle).first()).toBeVisible({ timeout: 8000 });
  });

  test('should delete a task', async ({ page }) => {
    await expect(page).toHaveURL(/.*tasks/);

    // Create a task to delete
    const taskTitle = `Delete Task ${Date.now()}`;
    await page.getByTestId('add-task-button').click();
    await page.getByLabel(/title/i).fill(taskTitle);
    await page.locator('form').getByRole('button', { name: /add task/i }).click();

    // Wait for task to appear
    await expect(page.getByText(taskTitle).first()).toBeVisible({ timeout: 8000 });

    // Count initial pending delete buttons
    const initialCount = await page.getByTestId('delete-task-button').count();
    
    // Delete the first task (our newly created task should be near the top)
    await page.getByTestId('delete-task-button').first().click();

    // Wait for count to decrease
    await expect(page.getByTestId('delete-task-button')).toHaveCount(initialCount - 1, { timeout: 8000 });
  });
});
