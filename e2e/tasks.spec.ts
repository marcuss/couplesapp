import { test, expect } from '@playwright/test';

test.describe('Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email').fill('test@example.com');
    await page.getByTestId('login-password').fill('password123');
    await page.getByTestId('login-submit').click();
    await page.waitForURL('/dashboard');
    await page.goto('/tasks');
  });

  test('should display tasks page', async ({ page }) => {
    await expect(page.getByText(/tasks/i)).toBeVisible();
    await expect(page.getByTestId('add-task-button')).toBeVisible();
  });

  test('should open add task modal', async ({ page }) => {
    await page.getByTestId('add-task-button').click();
    await expect(page.getByText(/add new task/i)).toBeVisible();
    await expect(page.getByLabel(/title/i)).toBeVisible();
  });

  test('should add a new task', async ({ page }) => {
    await page.getByTestId('add-task-button').click();
    
    await page.getByLabel(/title/i).fill('Test Task');
    await page.getByLabel(/description/i).fill('Test Description');
    
    await page.getByRole('button', { name: /add task/i }).click();
    
    await expect(page.getByText('Test Task')).toBeVisible();
  });
});
