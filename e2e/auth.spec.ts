import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();
  });

  test('should display register page', async ({ page }) => {
    await page.goto('/register');
    
    await expect(page.getByTestId('register-name')).toBeVisible();
    await expect(page.getByTestId('register-email')).toBeVisible();
    await expect(page.getByTestId('register-password')).toBeVisible();
    await expect(page.getByTestId('register-confirm-password')).toBeVisible();
    await expect(page.getByTestId('register-submit')).toBeVisible();
  });

  test('should show error for invalid login', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByTestId('login-email').fill('invalid@example.com');
    await page.getByTestId('login-password').fill('wrongpassword');
    await page.getByTestId('login-submit').click();
    
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login');
    
    // PR #17 moved ThemeToggle/LanguageSelector to ProfilePage.
    // The register link on login page shows "Register" (t('auth.register')), not "Sign up"
    await page.getByRole('link', { name: /register/i }).click();
    await expect(page).toHaveURL(/.*register/);
    
    // The login link on register page shows "Login" (t('auth.login')), not "Sign in"
    await page.getByRole('link', { name: /login/i }).click();
    await expect(page).toHaveURL(/.*login/);
  });
});
