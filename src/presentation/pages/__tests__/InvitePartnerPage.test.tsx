/**
 * InvitePartnerPage Tests — TDD
 *
 * Tests for:
 * - Tabs (email / share link)
 * - CopyLinkButton behavior
 * - Link generation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// ── Hoisted mocks (must be before vi.mock factories that reference them) ──────

const { mockNavigate, mockSupabaseInsert, mockSupabaseFunctionsInvoke } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockSupabaseInsert: vi.fn(),
  mockSupabaseFunctionsInvoke: vi.fn(),
}));

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'alice@test.com', name: 'Alice' },
    partner: null,
  }),
}));

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: mockSupabaseInsert,
    })),
    functions: {
      invoke: mockSupabaseFunctionsInvoke,
    },
  },
}));

vi.mock('../../../i18n', () => ({
  availableLanguages: [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  ],
}));

vi.mock('../../../templates/emails', () => ({
  createInvitationEmail: vi.fn(() => ({
    subject: 'You are invited!',
    html: '<p>Invite</p>',
    text: 'Invite',
  })),
}));

vi.mock('../../../lib/appUrl', () => ({
  getAppUrl: vi.fn(() => 'https://app.nextasy.co'),
  getInvitationUrl: vi.fn((token: string) => `https://app.nextasy.co/invitation/${token}`),
}));

// Mock clipboard
const clipboardWriteText = vi.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: clipboardWriteText },
  writable: true,
  configurable: true,
});

// Mock crypto.randomUUID
Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: vi.fn(() => 'test-uuid-1234') },
  writable: true,
  configurable: true,
});

// ── Static import ─────────────────────────────────────────────────────────────
import { InvitePartnerPage } from '../InvitePartnerPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <InvitePartnerPage />
    </MemoryRouter>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('InvitePartnerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseInsert.mockResolvedValue({ error: null });
    mockSupabaseFunctionsInvoke.mockResolvedValue({ error: null });
    clipboardWriteText.mockResolvedValue(undefined);
  });

  // ── Render ──────────────────────────────────────────────────────────────────

  it('renders the page with title', () => {
    renderPage();
    expect(screen.getByText('Invite Your Partner')).toBeTruthy();
  });

  it('renders two tabs: Send by email and Share link', () => {
    renderPage();
    expect(screen.getByRole('tab', { name: /send by email/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /share link/i })).toBeTruthy();
  });

  it('shows email form by default (tab A active)', () => {
    renderPage();
    expect(screen.getByLabelText(/partner.*email/i)).toBeTruthy();
  });

  // ── Tab B: Share link ────────────────────────────────────────────────────────

  it('switches to Share Link tab and shows generate button', async () => {
    renderPage();
    const shareLinkTab = screen.getByRole('tab', { name: /share link/i });
    fireEvent.click(shareLinkTab);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate.*link/i })).toBeTruthy();
    });
  });

  it('generates invitation link when clicking generate button', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /share link/i }));
    const generateBtn = await screen.findByRole('button', { name: /generate.*link/i });
    await act(async () => {
      fireEvent.click(generateBtn);
    });
    await waitFor(() => {
      expect(mockSupabaseInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'test-uuid-1234',
          inviter_id: 'user-123',
          status: 'pending',
        })
      );
    });
  });

  it('shows the invitation link after generating', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /share link/i }));
    const generateBtn = await screen.findByRole('button', { name: /generate.*link/i });
    await act(async () => {
      fireEvent.click(generateBtn);
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue(/invitation\/test-uuid-1234/)).toBeTruthy();
    });
  });

  // ── CopyLinkButton ──────────────────────────────────────────────────────────

  it('copy button calls navigator.clipboard.writeText', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /share link/i }));
    const generateBtn = await screen.findByRole('button', { name: /generate.*link/i });
    await act(async () => {
      fireEvent.click(generateBtn);
    });

    const copyBtn = await screen.findByRole('button', { name: /copy/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(clipboardWriteText).toHaveBeenCalledWith(
      expect.stringContaining('invitation/test-uuid-1234')
    );
  });

  it('copy button shows "Copied!" feedback after click', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /share link/i }));
    const generateBtn = await screen.findByRole('button', { name: /generate.*link/i });
    await act(async () => {
      fireEvent.click(generateBtn);
    });

    const copyBtn = await screen.findByRole('button', { name: /copy/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    await waitFor(() => {
      expect(screen.getByText(/copied/i)).toBeTruthy();
    });
  });

  // ── Tab A: Email ─────────────────────────────────────────────────────────────

  it('sends email invitation and shows success', async () => {
    renderPage();
    const emailInput = screen.getByLabelText(/partner.*email/i);
    fireEvent.change(emailInput, { target: { value: 'partner@example.com' } });
    const submitBtn = screen.getByRole('button', { name: /send invitation/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });
    await waitFor(() => {
      expect(screen.getByText(/invitation sent/i)).toBeTruthy();
    });
  });

  it('shows copy link button after sending email (success state)', async () => {
    renderPage();
    const emailInput = screen.getByLabelText(/partner.*email/i);
    fireEvent.change(emailInput, { target: { value: 'partner@example.com' } });
    const submitBtn = screen.getByRole('button', { name: /send invitation/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });
    await waitFor(() => {
      expect(screen.getByText(/invitation sent/i)).toBeTruthy();
    });
    // Should show the invitation link with a readonly input and copy button
    expect(screen.getByDisplayValue(/invitation\/test-uuid-1234/)).toBeTruthy();
  });

  // ── Back button ──────────────────────────────────────────────────────────────

  it('back button navigates to dashboard', () => {
    renderPage();
    const backBtn = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});
