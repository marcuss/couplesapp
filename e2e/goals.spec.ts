import { test, expect } from '@playwright/test';

const UNIQUE_TITLE = `E2E Goal ${Date.now()}`;

test.describe('Goals', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/goals');
    await page.waitForURL(/\/(goals|login)/, { timeout: 10000 });
  });

  test('should display goals page', async ({ page }) => {
    await expect(page).toHaveURL(/.*goals/);
    // Heading
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Add goal button
    await expect(page.getByTestId('add-goal-button')).toBeVisible();
  });

  test('should open add goal modal', async ({ page }) => {
    await expect(page).toHaveURL(/.*goals/);
    await page.getByTestId('add-goal-button').click();

    // Modal should appear
    await expect(page.getByTestId('goal-title-input')).toBeVisible();
    await expect(page.getByTestId('goal-description-input')).toBeVisible();
  });

  test('should close modal on cancel', async ({ page }) => {
    await expect(page).toHaveURL(/.*goals/);
    await page.getByTestId('add-goal-button').click();
    await expect(page.getByTestId('goal-title-input')).toBeVisible();

    // Click cancel button
    await page.locator('button', { hasText: /cancel/i }).click();
    await expect(page.getByTestId('goal-title-input')).not.toBeVisible();
  });

  test('should add a new goal', async ({ page }) => {
    await expect(page).toHaveURL(/.*goals/);
    await page.getByTestId('add-goal-button').click();

    await page.getByTestId('goal-title-input').fill(UNIQUE_TITLE);
    await page.getByTestId('goal-description-input').fill('E2E test goal description');

    // Submit the form
    await page.locator('form').getByRole('button', { name: /add goal/i }).click();

    // Modal should close and goal should appear
    await expect(page.getByText(UNIQUE_TITLE)).toBeVisible({ timeout: 8000 });
  });

  test('should complete a goal', async ({ page }) => {
    await expect(page).toHaveURL(/.*goals/);

    // Check if there's any active goal; if not, create one first
    const hasGoal = await page.getByTestId('complete-goal-button').first().isVisible().catch(() => false);

    if (!hasGoal) {
      await page.getByTestId('add-goal-button').click();
      await page.getByTestId('goal-title-input').fill(`Complete Test ${Date.now()}`);
      await page.locator('form').getByRole('button', { name: /add goal/i }).click();
      await page.waitForTimeout(1500);
    }

    // Click the first complete button
    const completeBtn = page.getByTestId('complete-goal-button').first();
    await expect(completeBtn).toBeVisible();
    await completeBtn.click();

    // Should update (completed goals section or goal removed from active)
    await page.waitForTimeout(1500);
    // Page should still be on goals
    await expect(page).toHaveURL(/.*goals/);
  });

  test('should delete a goal', async ({ page }) => {
    await expect(page).toHaveURL(/.*goals/);

    // Create a goal to delete
    const deleteTitle = `Delete Me ${Date.now()}`;
    await page.getByTestId('add-goal-button').click();
    await page.getByTestId('goal-title-input').fill(deleteTitle);
    await page.locator('form').getByRole('button', { name: /add goal/i }).click();

    // Wait for goal to appear
    await expect(page.getByText(deleteTitle)).toBeVisible({ timeout: 8000 });

    // Click delete button
    await page.getByTestId('delete-goal-button').first().click();

    // Goal should disappear
    await expect(page.getByText(deleteTitle)).not.toBeVisible({ timeout: 8000 });
  });
});
