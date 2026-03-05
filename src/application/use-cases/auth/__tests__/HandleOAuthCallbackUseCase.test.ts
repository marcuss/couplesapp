/**
 * HandleOAuthCallbackUseCase Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Result } from '../../../../shared/utils/Result';
import { UnauthorizedError } from '../../../../domain/errors/DomainError';
import { IAuthRepository } from '../../../../domain/repositories/IAuthRepository';
import { User } from '../../../../domain/entities/User';
import { HandleOAuthCallbackUseCase } from '../HandleOAuthCallbackUseCase';

function createMockUser(): User {
  return User.reconstitute({
    id: 'oauth-user-1',
    email: 'oauth@test.com',
    name: 'OAuth User',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function createMockRepo(overrides?: Partial<IAuthRepository>): IAuthRepository {
  return {
    signInWithGoogle: vi.fn().mockResolvedValue(Result.ok(undefined)),
    signInWithApple: vi.fn().mockResolvedValue(Result.ok(undefined)),
    handleOAuthCallback: vi.fn().mockResolvedValue(Result.ok(createMockUser())),
    ...overrides,
  };
}

describe('HandleOAuthCallbackUseCase', () => {
  let repo: IAuthRepository;
  let useCase: HandleOAuthCallbackUseCase;

  beforeEach(() => {
    repo = createMockRepo();
    useCase = new HandleOAuthCallbackUseCase(repo);
  });

  it('delegates to authRepository.handleOAuthCallback() with no URL', async () => {
    await useCase.execute();
    expect(repo.handleOAuthCallback).toHaveBeenCalledWith(undefined);
  });

  it('passes url to the repository when provided', async () => {
    const url = 'https://app.com/auth/callback#access_token=abc';
    await useCase.execute({ url });
    expect(repo.handleOAuthCallback).toHaveBeenCalledWith(url);
  });

  it('returns Result.ok(User) on successful callback', async () => {
    const result = await useCase.execute({ url: 'https://app.com/auth/callback#access_token=abc' });
    expect(result.isOk()).toBe(true);
    const user = result.getValue();
    expect(user.id).toBe('oauth-user-1');
    expect(user.email).toBe('oauth@test.com');
  });

  it('returns Result.fail when callback has no valid token', async () => {
    repo = createMockRepo({
      handleOAuthCallback: vi.fn().mockResolvedValue(
        Result.fail(new UnauthorizedError('No valid session in callback URL'))
      ),
    });
    useCase = new HandleOAuthCallbackUseCase(repo);

    const result = await useCase.execute({ url: 'https://app.com/auth/callback?error=access_denied' });
    expect(result.isFail()).toBe(true);
    expect(result.getError()).toBeInstanceOf(UnauthorizedError);
  });

  it('returns Result.fail when session extraction fails', async () => {
    repo = createMockRepo({
      handleOAuthCallback: vi.fn().mockResolvedValue(
        Result.fail(new UnauthorizedError('Invalid OAuth code'))
      ),
    });
    useCase = new HandleOAuthCallbackUseCase(repo);

    const result = await useCase.execute();
    expect(result.isFail()).toBe(true);
    expect(result.getError().message).toBe('Invalid OAuth code');
  });
});
