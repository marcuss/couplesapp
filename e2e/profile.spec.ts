import { test, expect } from '@playwright/test';

test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
    await page.waitForURL(/\/(profile|login)/, { timeout: 10000 });
  });

  test('should display profile page', async ({ page }) => {
    await expect(page).toHaveURL(/.*profile/);
    // User icon or profile heading
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // User email should be visible
    await expect(page.getByText(/e2e-test@couplesapp\.test/i)).toBeVisible();
  });

  test('should display partner connection section', async ({ page }) => {
    await expect(page).toHaveURL(/.*profile/);
    await expect(page.getByText(/partner connection/i)).toBeVisible();
  });

  test('should display preferences section', async ({ page }) => {
    await expect(page).toHaveURL(/.*profile/);
    await expect(page.getByTestId('preferences-section')).toBeVisible();
    // Dark mode toggle and language selector
    await expect(page.getByText(/modo oscuro/i)).toBeVisible();
    await expect(page.getByText(/idioma/i)).toBeVisible();
  });

  test('should display city section', async ({ page }) => {
    await expect(page).toHaveURL(/.*profile/);
    await expect(page.getByTestId('city-section')).toBeVisible();
    // Edit city button
    await expect(page.getByTestId('edit-city-btn')).toBeVisible();
  });

  test('should allow editing city', async ({ page }) => {
    await expect(page).toHaveURL(/.*profile/);

    // Click edit city
    await page.getByTestId('edit-city-btn').click();

    // City input should appear
    await expect(page.getByTestId('city-input')).toBeVisible();

    // Type a city
    await page.getByTestId('city-input').fill('Medellín');

    // Save button should be visible and enabled
    await expect(page.getByTestId('save-city-btn')).toBeEnabled();

    // Save
    await page.getByTestId('save-city-btn').click();

    // Should go back to display mode showing the city
    await expect(page.getByTestId('city-input')).not.toBeVisible({ timeout: 5000 });
  });

  test('should have a back-to-dashboard button', async ({ page }) => {
    await expect(page).toHaveURL(/.*profile/);
    // Back button
    await expect(page.getByText(/back to dashboard/i)).toBeVisible();
  });

  test('should have logout button', async ({ page }) => {
    await expect(page).toHaveURL(/.*profile/);
    await expect(page.getByRole('button', { name: /log out/i })).toBeVisible();
  });
});
