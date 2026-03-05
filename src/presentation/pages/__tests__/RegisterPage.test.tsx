/**
 * RegisterPage Tests — Password Strength & Validation UI
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

import { RegisterPage } from '../RegisterPage';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

const mockRegister = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    register: mockRegister,
    user: null,
  }),
}));

vi.mock('../../components/LanguageSelector', () => ({
  LanguageSelector: () => React.createElement('div', { 'data-testid': 'lang-selector' }),
}));

vi.mock('../../components/ThemeToggle', () => ({
  ThemeToggle: () => React.createElement('div', { 'data-testid': 'theme-toggle' }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderPage() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  );
}

function fillValidForm(overrides: { password?: string; confirmPassword?: string } = {}) {
  const password = overrides.password ?? 'Secure@123';
  const confirm = overrides.confirmPassword ?? password;

  fireEvent.change(screen.getByTestId('register-name'), { target: { value: 'Alice' } });
  fireEvent.change(screen.getByTestId('register-email'), { target: { value: 'alice@test.com' } });
  fireEvent.change(screen.getByTestId('register-password'), { target: { value: password } });
  fireEvent.change(screen.getByTestId('register-confirm-password'), { target: { value: confirm } });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RegisterPage — password requirements display', () => {
  beforeEach(() => {
    mockRegister.mockResolvedValue({ error: null });
  });

  it('renders the registration form', () => {
    renderPage();
    expect(screen.getByTestId('register-name')).toBeDefined();
    expect(screen.getByTestId('register-email')).toBeDefined();
    expect(screen.getByTestId('register-password')).toBeDefined();
    expect(screen.getByTestId('register-confirm-password')).toBeDefined();
    expect(screen.getByTestId('register-submit')).toBeDefined();
  });

  it('shows password requirements after typing in the password field', () => {
    renderPage();
    fireEvent.change(screen.getByTestId('register-password'), {
      target: { value: 'a' },
    });
    expect(screen.getByTestId('password-requirements')).toBeDefined();
  });

  it('shows all 5 requirements in the requirements list', () => {
    renderPage();
    fireEvent.change(screen.getByTestId('register-password'), {
      target: { value: 'a' },
    });
    const req = screen.getByTestId('password-requirements');
    // 5 <li> elements
    const items = req.querySelectorAll('li');
    expect(items.length).toBe(5);
  });

  it('shows the strength meter when password is entered', () => {
    renderPage();
    fireEvent.change(screen.getByTestId('register-password'), {
      target: { value: 'Secure@123' },
    });
    expect(screen.getByTestId('password-strength-meter')).toBeDefined();
    expect(screen.getByTestId('strength-label')).toBeDefined();
  });
});

describe('RegisterPage — submit button state', () => {
  beforeEach(() => {
    mockRegister.mockResolvedValue({ error: null });
  });

  it('submit button is disabled on initial render (empty form)', () => {
    renderPage();
    const btn = screen.getByTestId('register-submit') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('submit button is disabled when password is invalid (too short)', () => {
    renderPage();
    fillValidForm({ password: 'Short1!', confirmPassword: 'Short1!' });
    const btn = screen.getByTestId('register-submit') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('submit button is disabled when password has no uppercase letter', () => {
    renderPage();
    fillValidForm({ password: 'secure@123', confirmPassword: 'secure@123' });
    const btn = screen.getByTestId('register-submit') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('submit button is disabled when password has no special character', () => {
    renderPage();
    fillValidForm({ password: 'Secure1234', confirmPassword: 'Secure1234' });
    const btn = screen.getByTestId('register-submit') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('submit button is disabled when password has no number', () => {
    renderPage();
    fillValidForm({ password: 'Secure@abc', confirmPassword: 'Secure@abc' });
    const btn = screen.getByTestId('register-submit') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('submit button is disabled when password has no lowercase letter', () => {
    renderPage();
    fillValidForm({ password: 'SECURE@123', confirmPassword: 'SECURE@123' });
    const btn = screen.getByTestId('register-submit') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('submit button is ENABLED with a valid password and all fields filled', () => {
    renderPage();
    fillValidForm();
    const btn = screen.getByTestId('register-submit') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('submit button is disabled when passwords do not match', () => {
    renderPage();
    fillValidForm({ password: 'Secure@123', confirmPassword: 'Secure@999' });
    const btn = screen.getByTestId('register-submit') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});

describe('RegisterPage — inline validation feedback', () => {
  beforeEach(() => {
    mockRegister.mockResolvedValue({ error: null });
  });

  it('shows inline error for too-short password after touching the field', () => {
    renderPage();
    const pwInput = screen.getByTestId('register-password');
    fireEvent.change(pwInput, { target: { value: 'Ab1!' } });
    fireEvent.blur(pwInput);
    expect(screen.getByTestId('password-inline-error')).toBeDefined();
    expect(screen.getByTestId('password-inline-error').textContent).toMatch(/8/);
  });

  it('shows inline error for missing uppercase after touching the field', () => {
    renderPage();
    const pwInput = screen.getByTestId('register-password');
    fireEvent.change(pwInput, { target: { value: 'secure@123' } });
    fireEvent.blur(pwInput);
    const err = screen.getByTestId('password-inline-error');
    expect(err.textContent?.toLowerCase()).toContain('uppercase');
  });

  it('shows inline error for missing special character', () => {
    renderPage();
    const pwInput = screen.getByTestId('register-password');
    fireEvent.change(pwInput, { target: { value: 'Secure1234' } });
    fireEvent.blur(pwInput);
    const err = screen.getByTestId('password-inline-error');
    expect(err.textContent?.toLowerCase()).toContain('special');
  });

  it('hides inline error when password becomes valid', () => {
    renderPage();
    const pwInput = screen.getByTestId('register-password');
    // First make it invalid
    fireEvent.change(pwInput, { target: { value: 'bad' } });
    fireEvent.blur(pwInput);
    // Now fix it
    fireEvent.change(pwInput, { target: { value: 'Secure@123' } });
    expect(screen.queryByTestId('password-inline-error')).toBeNull();
  });

  it('calls register on valid form submit', async () => {
    renderPage();
    fillValidForm();
    fireEvent.click(screen.getByTestId('register-submit'));
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('alice@test.com', 'Secure@123', 'Alice');
    });
  });
});
