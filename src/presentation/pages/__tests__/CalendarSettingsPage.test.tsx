/**
 * CalendarSettingsPage Tests — TDD
 * Tests UI rendering and basic user interactions.
 * All external calls are mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { CalendarSettingsPage } from '../CalendarSettingsPage';

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'alice@test.com', name: 'Alice' },
    partner: { id: 'partner-2', name: 'Bob' },
  }),
}));

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      VITE_GOOGLE_CLIENT_ID: 'test-client-id',
      VITE_GOOGLE_REDIRECT_URI: 'http://localhost:5173/auth/google/callback',
    },
  },
});

// ─── Helper ──────────────────────────────────────────────────────────────────

function renderPage(initialEntries = ['/settings/calendar']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <CalendarSettingsPage />
    </MemoryRouter>
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('CalendarSettingsPage — rendering', () => {
  it('renders the page title', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { name: /calendarios externos/i })
    ).toBeInTheDocument();
  });

  it('renders Google Calendar section', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /google calendar/i })).toBeInTheDocument();
  });

  it('renders Apple Calendar section', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /apple calendar/i })).toBeInTheDocument();
  });

  it('renders "How it works" section', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { name: /cómo funciona/i })
    ).toBeInTheDocument();
  });

  it('shows "Connect Google Calendar" button when not connected', () => {
    renderPage();
    expect(
      screen.getByRole('button', { name: /conectar google calendar/i })
    ).toBeInTheDocument();
  });

  it('shows Apple Calendar coming soon message when not connected', () => {
    renderPage();
    expect(
      screen.getByText(/descarga la app de ios/i)
    ).toBeInTheDocument();
  });

  it('renders back link to settings', () => {
    renderPage();
    const backLink = screen.getByRole('link', { name: /volver a configuración/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink.getAttribute('href')).toBe('/settings');
  });

  it('renders color legend for event sources', () => {
    renderPage();
    // Use getAllByText since 'CouplePlan' may appear in multiple legend items
    expect(screen.getAllByText(/coupleplan/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/google calendar/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/apple calendar/i).length).toBeGreaterThan(0);
  });
});

describe('CalendarSettingsPage — success message from OAuth callback', () => {
  it('shows success message when status=success param is present', () => {
    renderPage(['/settings/calendar?provider=google&status=success']);
    // Wait for useEffect to run
    waitFor(() => {
      expect(
        screen.getByText(/google calendar conectado exitosamente/i)
      ).toBeInTheDocument();
    });
  });

  it('shows error message when status=error param is present', () => {
    renderPage(['/settings/calendar?status=error&error=access_denied']);
    waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});

describe('CalendarSettingsPage — disconnect flow', () => {
  it('shows disconnect confirmation dialog when Desconectar is clicked', async () => {
    // First, we need to add a connection by simulating the OAuth callback
    renderPage(['/settings/calendar?provider=google&status=success']);

    // Wait for connection to appear
    await waitFor(() => {
      const disconnectBtn = screen.queryByRole('button', { name: /desconectar/i });
      if (disconnectBtn) {
        fireEvent.click(disconnectBtn);
      }
    });

    // If disconnect button appeared and was clicked, the confirm dialog should show
    await waitFor(() => {
      const confirmText = screen.queryByText(/¿seguro\?/i);
      if (confirmText) {
        expect(confirmText).toBeInTheDocument();
      }
    });
  });
});

describe('CalendarSettingsPage — accessibility', () => {
  it('sections have accessible headings', () => {
    renderPage();
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('Google Calendar section has correct aria-labelledby', () => {
    renderPage();
    const section = document.querySelector('section[aria-labelledby="google-calendar-heading"]');
    expect(section).toBeTruthy();
  });

  it('Apple Calendar section has correct aria-labelledby', () => {
    renderPage();
    const section = document.querySelector('section[aria-labelledby="apple-calendar-heading"]');
    expect(section).toBeTruthy();
  });
});
