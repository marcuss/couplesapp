/**
 * SignInWithAppleUseCase Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Result } from '../../../../shared/utils/Result';
import { DatabaseError } from '../../../../domain/errors/DomainError';
import { IAuthRepository } from '../../../../domain/repositories/IAuthRepository';
import { SignInWithAppleUseCase } from '../SignInWithAppleUseCase';

function createMockRepo(overrides?: Partial<IAuthRepository>): IAuthRepository {
  return {
    signInWithGoogle: vi.fn().mockResolvedValue(Result.ok(undefined)),
    signInWithApple: vi.fn().mockResolvedValue(Result.ok(undefined)),
    handleOAuthCallback: vi.fn().mockResolvedValue(Result.ok(undefined)),
    ...overrides,
  };
}

describe('SignInWithAppleUseCase', () => {
  let repo: IAuthRepository;
  let useCase: SignInWithAppleUseCase;

  beforeEach(() => {
    repo = createMockRepo();
    useCase = new SignInWithAppleUseCase(repo);
  });

  it('delegates to authRepository.signInWithApple()', async () => {
    await useCase.execute();
    expect(repo.signInWithApple).toHaveBeenCalledTimes(1);
  });

  it('returns Result.ok on success', async () => {
    const result = await useCase.execute();
    expect(result.isOk()).toBe(true);
  });

  it('propagates failure when provider is not configured', async () => {
    repo = createMockRepo({
      signInWithApple: vi.fn().mockResolvedValue(
        Result.fail(new DatabaseError('Apple OAuth provider not enabled'))
      ),
    });
    useCase = new SignInWithAppleUseCase(repo);

    const result = await useCase.execute();
    expect(result.isFail()).toBe(true);
    expect(result.getError()).toBeInstanceOf(DatabaseError);
    expect(result.getError().message).toContain('not enabled');
  });

  it('does NOT call signInWithGoogle', async () => {
    await useCase.execute();
    expect(repo.signInWithGoogle).not.toHaveBeenCalled();
  });

  it('does NOT call handleOAuthCallback', async () => {
    await useCase.execute();
    expect(repo.handleOAuthCallback).not.toHaveBeenCalled();
  });
});
