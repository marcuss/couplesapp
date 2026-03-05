/**
 * SignInWithGoogleUseCase Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Result } from '../../../../shared/utils/Result';
import { DatabaseError } from '../../../../domain/errors/DomainError';
import { IAuthRepository } from '../../../../domain/repositories/IAuthRepository';
import { SignInWithGoogleUseCase } from '../SignInWithGoogleUseCase';

function createMockRepo(overrides?: Partial<IAuthRepository>): IAuthRepository {
  return {
    signInWithGoogle: vi.fn().mockResolvedValue(Result.ok(undefined)),
    signInWithApple: vi.fn().mockResolvedValue(Result.ok(undefined)),
    handleOAuthCallback: vi.fn().mockResolvedValue(Result.ok(undefined)),
    ...overrides,
  };
}

describe('SignInWithGoogleUseCase', () => {
  let repo: IAuthRepository;
  let useCase: SignInWithGoogleUseCase;

  beforeEach(() => {
    repo = createMockRepo();
    useCase = new SignInWithGoogleUseCase(repo);
  });

  it('delegates to authRepository.signInWithGoogle()', async () => {
    await useCase.execute();
    expect(repo.signInWithGoogle).toHaveBeenCalledTimes(1);
  });

  it('returns Result.ok on success', async () => {
    const result = await useCase.execute();
    expect(result.isOk()).toBe(true);
  });

  it('propagates failure when provider is not configured', async () => {
    repo = createMockRepo({
      signInWithGoogle: vi.fn().mockResolvedValue(
        Result.fail(new DatabaseError('Google OAuth provider not enabled'))
      ),
    });
    useCase = new SignInWithGoogleUseCase(repo);

    const result = await useCase.execute();
    expect(result.isFail()).toBe(true);
    expect(result.getError()).toBeInstanceOf(DatabaseError);
    expect(result.getError().message).toContain('not enabled');
  });

  it('does NOT call signInWithApple', async () => {
    await useCase.execute();
    expect(repo.signInWithApple).not.toHaveBeenCalled();
  });

  it('does NOT call handleOAuthCallback', async () => {
    await useCase.execute();
    expect(repo.handleOAuthCallback).not.toHaveBeenCalled();
  });
});
