import { test, expect } from '@playwright/test';

test.describe('Budgets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/budgets');
    await page.waitForURL(/\/(budgets|login)/, { timeout: 10000 });
  });

  test('should display budgets page', async ({ page }) => {
    await expect(page).toHaveURL(/.*budgets/);
    // Page heading
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Add budget button
    await expect(page.getByTestId('add-budget-button')).toBeVisible();
  });

  test('should open add budget modal', async ({ page }) => {
    await expect(page).toHaveURL(/.*budgets/);
    await page.getByTestId('add-budget-button').click();

    await expect(page.getByTestId('budget-category-input')).toBeVisible();
    await expect(page.getByTestId('budget-amount-input')).toBeVisible();
  });

  test('should close modal on cancel', async ({ page }) => {
    await expect(page).toHaveURL(/.*budgets/);
    await page.getByTestId('add-budget-button').click();
    await expect(page.getByTestId('budget-category-input')).toBeVisible();

    await page.locator('button', { hasText: /cancel/i }).click();
    await expect(page.getByTestId('budget-category-input')).not.toBeVisible();
  });

  test('should add a new budget', async ({ page }) => {
    await expect(page).toHaveURL(/.*budgets/);
    await page.getByTestId('add-budget-button').click();

    const category = `vacaciones-${Date.now()}`;
    await page.getByTestId('budget-category-input').fill(category);
    await page.getByTestId('budget-amount-input').fill('1000');

    await page.locator('form').getByRole('button', { name: /add budget/i }).click();

    // Budget should appear in the list
    await expect(page.getByText(category)).toBeVisible({ timeout: 8000 });
  });

  test('should show summary stats', async ({ page }) => {
    await expect(page).toHaveURL(/.*budgets/);

    // Summary cards: total budget, total spent, remaining
    await expect(page.getByText(/total budget/i)).toBeVisible();
    await expect(page.getByText(/total spent/i)).toBeVisible();
    await expect(page.getByText(/total remaining/i)).toBeVisible();
  });

  test('should delete a budget', async ({ page }) => {
    await expect(page).toHaveURL(/.*budgets/);

    // Create a budget to delete
    const category = `delete-test-${Date.now()}`;
    await page.getByTestId('add-budget-button').click();
    await page.getByTestId('budget-category-input').fill(category);
    await page.getByTestId('budget-amount-input').fill('500');
    await page.locator('form').getByRole('button', { name: /add budget/i }).click();

    // Wait for budget to appear
    await expect(page.getByText(category)).toBeVisible({ timeout: 8000 });

    // Delete it
    await page.getByTestId('delete-budget-button').first().click();

    // Should disappear
    await expect(page.getByText(category)).not.toBeVisible({ timeout: 8000 });
  });
});
