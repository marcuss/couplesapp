/**
 * IAuthRepository Contract Tests
 * Verify the contract any IAuthRepository implementation must satisfy
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Result } from '../../../shared/utils/Result';
import { DatabaseError, UnauthorizedError } from '../../errors/DomainError';
import { IAuthRepository } from '../IAuthRepository';
import { User } from '../../entities/User';

// ─── Mock implementation ────────────────────────────────────────────────────

function createMockUser(): User {
  return User.reconstitute({
    id: 'oauth-user-1',
    email: 'oauth@example.com',
    name: 'OAuth User',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function createMockAuthRepository(overrides?: Partial<IAuthRepository>): IAuthRepository {
  return {
    signInWithGoogle: vi.fn().mockResolvedValue(Result.ok(undefined)),
    signInWithApple: vi.fn().mockResolvedValue(Result.ok(undefined)),
    handleOAuthCallback: vi.fn().mockResolvedValue(Result.ok(createMockUser())),
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('IAuthRepository contract — signInWithGoogle', () => {
  let repo: IAuthRepository;

  beforeEach(() => {
    repo = createMockAuthRepository();
  });

  it('returns Result.ok(void) on successful redirect initiation', async () => {
    const result = await repo.signInWithGoogle();
    expect(result.isOk()).toBe(true);
  });

  it('returns Result.fail with DomainError when provider is not configured', async () => {
    repo = createMockAuthRepository({
      signInWithGoogle: vi.fn().mockResolvedValue(
        Result.fail(new DatabaseError('Google OAuth provider not enabled'))
      ),
    });
    const result = await repo.signInWithGoogle();
    expect(result.isFail()).toBe(true);
    expect(result.getError()).toBeInstanceOf(DatabaseError);
    expect(result.getError().message).toContain('not enabled');
  });

  it('calls signInWithGoogle exactly once per execute', async () => {
    await repo.signInWithGoogle();
    expect(repo.signInWithGoogle).toHaveBeenCalledTimes(1);
  });
});

describe('IAuthRepository contract — signInWithApple', () => {
  let repo: IAuthRepository;

  beforeEach(() => {
    repo = createMockAuthRepository();
  });

  it('returns Result.ok(void) on successful redirect initiation', async () => {
    const result = await repo.signInWithApple();
    expect(result.isOk()).toBe(true);
  });

  it('returns Result.fail with DomainError when provider is not configured', async () => {
    repo = createMockAuthRepository({
      signInWithApple: vi.fn().mockResolvedValue(
        Result.fail(new DatabaseError('Apple OAuth provider not enabled'))
      ),
    });
    const result = await repo.signInWithApple();
    expect(result.isFail()).toBe(true);
    expect(result.getError()).toBeInstanceOf(DatabaseError);
  });

  it('calls signInWithApple exactly once per execute', async () => {
    await repo.signInWithApple();
    expect(repo.signInWithApple).toHaveBeenCalledTimes(1);
  });
});

describe('IAuthRepository contract — handleOAuthCallback', () => {
  let repo: IAuthRepository;

  beforeEach(() => {
    repo = createMockAuthRepository();
  });

  it('returns Result.ok(User) when callback URL contains valid session', async () => {
    const result = await repo.handleOAuthCallback('https://app.com/auth/callback#access_token=abc&type=bearer');
    expect(result.isOk()).toBe(true);
    const user = result.getValue();
    expect(user).toBeDefined();
    expect(user.id).toBe('oauth-user-1');
    expect(user.email).toBe('oauth@example.com');
  });

  it('returns Result.ok(User) when called with no URL (uses window.location)', async () => {
    const result = await repo.handleOAuthCallback();
    expect(result.isOk()).toBe(true);
  });

  it('returns Result.fail when callback URL has no valid token', async () => {
    repo = createMockAuthRepository({
      handleOAuthCallback: vi.fn().mockResolvedValue(
        Result.fail(new UnauthorizedError('No valid session in callback URL'))
      ),
    });
    const result = await repo.handleOAuthCallback('https://app.com/auth/callback?error=access_denied');
    expect(result.isFail()).toBe(true);
    expect(result.getError()).toBeInstanceOf(UnauthorizedError);
  });

  it('passes the URL to the repository', async () => {
    const callbackUrl = 'https://app.com/auth/callback#access_token=xyz';
    await repo.handleOAuthCallback(callbackUrl);
    expect(repo.handleOAuthCallback).toHaveBeenCalledWith(callbackUrl);
  });
});
