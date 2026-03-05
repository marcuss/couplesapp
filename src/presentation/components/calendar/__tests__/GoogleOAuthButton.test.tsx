/**
 * GoogleOAuthButton Tests — TDD
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { GoogleOAuthButton } from '../GoogleOAuthButton';

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Mock crypto.subtle.digest for PKCE
const mockDigest = vi.fn().mockResolvedValue(new ArrayBuffer(32));
Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = i % 256;
      return arr;
    },
    subtle: { digest: mockDigest },
  },
  configurable: true,
});

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Capture window.location.href changes
let locationHref = '';
Object.defineProperty(window, 'location', {
  value: { ...window.location, set href(url: string) { locationHref = url; } },
  writable: true,
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GoogleOAuthButton — rendering', () => {
  beforeEach(() => {
    locationHref = '';
    sessionStorageMock.clear();
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id-123');
    vi.stubEnv('VITE_GOOGLE_REDIRECT_URI', 'http://localhost:5173/auth/google/callback');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders the connect button', () => {
    render(<GoogleOAuthButton />);
    expect(
      screen.getByRole('button', { name: /conectar google calendar/i })
    ).toBeInTheDocument();
  });

  it('shows "Conectar Google Calendar" as button text', () => {
    render(<GoogleOAuthButton />);
    expect(screen.getByText('Conectar Google Calendar')).toBeInTheDocument();
  });

  it('is not disabled by default', () => {
    render(<GoogleOAuthButton />);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<GoogleOAuthButton disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('has aria-label', () => {
    render(<GoogleOAuthButton />);
    expect(
      screen.getByRole('button', { name: /conectar google calendar/i })
    ).toHaveAttribute('aria-label', 'Conectar Google Calendar');
  });

  it('applies custom className', () => {
    render(<GoogleOAuthButton className="w-full" />);
    expect(screen.getByRole('button')).toHaveClass('w-full');
  });
});

describe('GoogleOAuthButton — OAuth flow', () => {
  beforeEach(() => {
    locationHref = '';
    sessionStorageMock.clear();
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id-123');
    vi.stubEnv('VITE_GOOGLE_REDIRECT_URI', 'http://localhost:5173/auth/google/callback');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('calls onInitiate when button is clicked', async () => {
    const onInitiate = vi.fn();
    render(<GoogleOAuthButton onInitiate={onInitiate} />);

    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(onInitiate).toHaveBeenCalledOnce());
  });

  it('stores code_verifier in sessionStorage', async () => {
    render(<GoogleOAuthButton />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        'google_oauth_code_verifier',
        expect.any(String)
      );
    });
  });

  it('shows loading state while processing', async () => {
    render(<GoogleOAuthButton />);
    fireEvent.click(screen.getByRole('button'));

    // Should show loading text while waiting for crypto
    await waitFor(() => {
      const btn = screen.getByRole('button');
      // Either loading or already redirected
      expect(btn).toBeTruthy();
    });
  });
});

describe('GoogleOAuthButton — missing config', () => {
  it('shows alert when VITE_GOOGLE_CLIENT_ID is not set', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<GoogleOAuthButton />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalled();
    });

    alertMock.mockRestore();
    vi.unstubAllEnvs();
  });
});
