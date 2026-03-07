import { test, expect } from '@playwright/test';

// Auth state is pre-loaded via storageState from global-setup.ts
// Use current-month dates so events appear in "Events this month" section (which has delete buttons)
const CURRENT_MONTH_DATE = (() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-20`;
})();

test.describe('Events', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/events');
    await page.waitForURL(/\/(events|login)/, { timeout: 10000 });
  });

  test('should display events page', async ({ page }) => {
    await expect(page).toHaveURL(/.*events/);
    await expect(page.getByRole('heading', { name: 'Events', exact: true })).toBeVisible();
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
    const uniqueTitle = `Test Event ${Date.now()}`;
    await page.getByTestId('add-event-button').click();
    
    await page.getByLabel(/title/i).fill(uniqueTitle);
    await page.getByLabel(/description/i).fill('Test Description');
    await page.getByLabel(/date/i).fill(CURRENT_MONTH_DATE);
    await page.getByLabel(/time/i).fill('18:00');
    
    await page.locator('form').getByRole('button', { name: /add event/i }).click();
    
    await expect(page.getByText(uniqueTitle).first()).toBeVisible({ timeout: 8000 });
  });

  test('should delete an event', async ({ page }) => {
    await expect(page).toHaveURL(/.*events/);

    // Create an event in the current month so it appears in "Events this month" section
    const eventTitle = `Delete Event ${Date.now()}`;
    await page.getByTestId('add-event-button').click();
    await page.getByLabel(/title/i).fill(eventTitle);
    await page.getByLabel(/date/i).fill(CURRENT_MONTH_DATE);
    await page.locator('form').getByRole('button', { name: /add event/i }).click();

    // Wait for our specific event to appear
    await expect(page.getByRole('heading', { name: eventTitle })).toBeVisible({ timeout: 8000 });

    // Navigate from the heading: h4 -> parent div.flex-1 -> parent row div -> delete button
    const deleteBtn = page.getByRole('heading', { name: eventTitle })
      .locator('xpath=../..').getByTestId('delete-event-button');
    await deleteBtn.click();

    // Event heading should be removed
    await expect(page.getByRole('heading', { name: eventTitle })).not.toBeVisible({ timeout: 8000 });
  });
});
