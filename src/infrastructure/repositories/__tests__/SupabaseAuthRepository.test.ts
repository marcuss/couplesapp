/**
 * SupabaseAuthRepository Tests
 * Tests the Supabase OAuth implementation using mocks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Result } from '../../../shared/utils/Result';
import { DatabaseError, UnauthorizedError } from '../../../domain/errors/DomainError';

// Mock Supabase before importing the repo
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(),
  },
}));

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: { env: { VITE_APP_URL: 'https://app.test.com' } },
});

import { supabase } from '../../../lib/supabase';
import { SupabaseAuthRepository } from '../SupabaseAuthRepository';

const mockSignInWithOAuth = vi.mocked(supabase.auth.signInWithOAuth);
const mockGetSession = vi.mocked(supabase.auth.getSession);
const mockFrom = vi.mocked(supabase.from);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mockProfileQuery(profile: Record<string, unknown> | null, error?: { code?: string; message: string } | null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: profile, error: error ?? null }),
  };
  mockFrom.mockReturnValue(chain as unknown as ReturnType<typeof supabase.from>);
  return chain;
}

function mockInsertQuery(error?: { message: string } | null) {
  const chain = {
    insert: vi.fn().mockResolvedValue({ data: null, error: error ?? null }),
  };
  mockFrom.mockReturnValue(chain as unknown as ReturnType<typeof supabase.from>);
  return chain;
}

const existingProfile = {
  id: 'user-1',
  email: 'user@test.com',
  name: 'Test User',
  partner_id: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockSession = {
  session: {
    user: {
      id: 'user-1',
      email: 'user@test.com',
      user_metadata: { full_name: 'Test User' },
    },
  },
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SupabaseAuthRepository', () => {
  let repo: SupabaseAuthRepository;

  beforeEach(() => {
    repo = new SupabaseAuthRepository();
    vi.clearAllMocks();
  });

  // ── signInWithGoogle ──────────────────────────────────────────────────────

  describe('signInWithGoogle()', () => {
    it('calls supabase.auth.signInWithOAuth with provider=google', async () => {
      mockSignInWithOAuth.mockResolvedValue({ data: { provider: 'google', url: 'https://google.com/oauth' }, error: null });

      await repo.signInWithGoogle();

      expect(mockSignInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'google' })
      );
    });

    it('includes redirectTo and scopes in options', async () => {
      mockSignInWithOAuth.mockResolvedValue({ data: { provider: 'google', url: '' }, error: null });

      await repo.signInWithGoogle();

      const callArg = mockSignInWithOAuth.mock.calls[0][0];
      expect(callArg.options?.redirectTo).toContain('/auth/callback');
      expect(callArg.options?.scopes).toContain('email');
    });

    it('returns Result.ok on success', async () => {
      mockSignInWithOAuth.mockResolvedValue({ data: { provider: 'google', url: '' }, error: null });

      const result = await repo.signInWithGoogle();
      expect(result.isOk()).toBe(true);
    });

    it('returns Result.fail(DatabaseError) when supabase returns an error', async () => {
      mockSignInWithOAuth.mockResolvedValue({
        data: { provider: 'google', url: '' },
        error: { message: 'Provider not enabled' } as never,
      });

      const result = await repo.signInWithGoogle();
      expect(result.isFail()).toBe(true);
      expect(result.getError()).toBeInstanceOf(DatabaseError);
    });
  });

  // ── signInWithApple ───────────────────────────────────────────────────────

  describe('signInWithApple()', () => {
    it('calls supabase.auth.signInWithOAuth with provider=apple', async () => {
      mockSignInWithOAuth.mockResolvedValue({ data: { provider: 'apple', url: '' }, error: null });

      await repo.signInWithApple();

      expect(mockSignInWithOAuth).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'apple' })
      );
    });

    it('includes redirectTo in options', async () => {
      mockSignInWithOAuth.mockResolvedValue({ data: { provider: 'apple', url: '' }, error: null });

      await repo.signInWithApple();

      const callArg = mockSignInWithOAuth.mock.calls[0][0];
      expect(callArg.options?.redirectTo).toContain('/auth/callback');
    });

    it('returns Result.ok on success', async () => {
      mockSignInWithOAuth.mockResolvedValue({ data: { provider: 'apple', url: '' }, error: null });

      const result = await repo.signInWithApple();
      expect(result.isOk()).toBe(true);
    });

    it('returns Result.fail(DatabaseError) when supabase returns an error', async () => {
      mockSignInWithOAuth.mockResolvedValue({
        data: { provider: 'apple', url: '' },
        error: { message: 'Apple OAuth not configured' } as never,
      });

      const result = await repo.signInWithApple();
      expect(result.isFail()).toBe(true);
      expect(result.getError()).toBeInstanceOf(DatabaseError);
    });
  });

  // ── handleOAuthCallback ───────────────────────────────────────────────────

  describe('handleOAuthCallback()', () => {
    it('returns Result.ok(User) when session exists and profile exists', async () => {
      mockGetSession.mockResolvedValue({ data: mockSession, error: null } as never);
      mockProfileQuery(existingProfile);

      const result = await repo.handleOAuthCallback();

      expect(result.isOk()).toBe(true);
      const user = result.getValue();
      expect(user.id).toBe('user-1');
      expect(user.email).toBe('user@test.com');
    });

    it('creates profile for first-time OAuth user and returns User', async () => {
      mockGetSession.mockResolvedValue({ data: mockSession, error: null } as never);

      // First call: select profile (not found), second call: insert
      const selectChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'Not found' } }),
      };
      const insertChain = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      mockFrom
        .mockReturnValueOnce(selectChain as unknown as ReturnType<typeof supabase.from>)
        .mockReturnValueOnce(insertChain as unknown as ReturnType<typeof supabase.from>);

      const result = await repo.handleOAuthCallback();

      expect(result.isOk()).toBe(true);
      const user = result.getValue();
      expect(user.id).toBe('user-1');
    });

    it('returns Result.fail(UnauthorizedError) when no session', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null } as never);

      const result = await repo.handleOAuthCallback();

      expect(result.isFail()).toBe(true);
      expect(result.getError()).toBeInstanceOf(UnauthorizedError);
    });

    it('returns Result.fail(UnauthorizedError) when getSession returns error', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'JWT expired' },
      } as never);

      const result = await repo.handleOAuthCallback();

      expect(result.isFail()).toBe(true);
      expect(result.getError()).toBeInstanceOf(UnauthorizedError);
    });
  });
});
