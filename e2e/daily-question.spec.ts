import { test, expect } from '@playwright/test';

/**
 * Daily Question E2E tests
 *
 * NOTE: Full question + answer flow requires a couple (coupleId).
 * The test user (e2e-test@couplesapp.test) has no partner linked,
 * so the page renders in a permanent loading state (coupleId missing).
 * Tests verify routing and the page frame; data-flow tests are skipped.
 */
test.describe('Daily Question', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/daily-question');
    await page.waitForURL(/\/(daily-question|login)/, { timeout: 10000 });
  });

  test('should route to daily-question page when authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/.*daily-question/);
  });

  test('should render the page container', async ({ page }) => {
    await expect(page).toHaveURL(/.*daily-question/);
    await expect(page.getByTestId('daily-question-page')).toBeVisible();
  });

  test('should show today\'s question page title', async ({ page }) => {
    await expect(page).toHaveURL(/.*daily-question/);
    await expect(page.getByTestId('daily-question-page')).toBeVisible();
    await expect(page.getByText(/today'?s question/i)).toBeVisible();
  });

  test('should have a back link to dashboard', async ({ page }) => {
    await expect(page).toHaveURL(/.*daily-question/);
    // Scope to the page container to find the back arrow link specifically
    const backLink = page.getByTestId('daily-question-page').getByRole('link');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/dashboard');
  });

  test.skip('should show answer form when question loaded (requires couple setup)', async ({ page }) => {
    // Skipped: the test user has no partner, so coupleId is empty and the page
    // shows a permanent loading spinner. To enable: link the test account to a partner.
    await expect(page.getByTestId('answer-textarea')).toBeVisible();
    await expect(page.getByTestId('submit-answer-button')).toBeVisible();
    await expect(page.getByTestId('submit-answer-button')).toBeDisabled();
    await page.getByTestId('answer-textarea').fill('My thoughtful answer');
    await expect(page.getByTestId('submit-answer-button')).toBeEnabled();
  });
});
