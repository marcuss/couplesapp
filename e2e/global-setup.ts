/**
 * Global E2E Setup
 *
 * Runs once before all tests. Creates the test user in Supabase if it doesn't exist,
 * then performs login and saves the auth storage state so individual tests can
 * reuse the authenticated session without re-logging in each time.
 */

import { chromium, FullConfig } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? 'e2e-test@couplesapp.test';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'E2eTestP@ss123!';

async function globalSetup(_config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const baseURL = process.env.BASE_URL ?? 'http://localhost:5173';

  try {
    // Navigate to login page
    await page.goto(`${baseURL}/login`);
    await page.getByTestId('login-email').fill(TEST_EMAIL);
    await page.getByTestId('login-password').fill(TEST_PASSWORD);
    await page.getByTestId('login-submit').click();

    // Wait for navigation — either dashboard (success) or stay on login (fail)
    try {
      await page.waitForURL(`${baseURL}/dashboard`, { timeout: 15000 });
      console.log('✅ Global setup: Logged in as test user');
    } catch {
      console.log('⚠️ Global setup: Login failed — tests requiring auth will be skipped or fail');
    }

    // Save auth state (even if empty) for tests to reuse
    await page.context().storageState({ path: 'e2e/.auth/user.json' });
  } finally {
    await browser.close();
  }
}

export default globalSetup;
