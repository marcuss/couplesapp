/**
 * RegisterUseCase Tests — Password Validation Integration
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterUseCase, IAuthServiceRegister } from '../RegisterUseCase';
import { IUserRepository } from '../../../../domain/repositories/IUserRepository';
import { Result } from '../../../../shared/utils/Result';
import { PasswordError } from '../../../../domain/value-objects/Password';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createMockUserRepo(emailExists = false): IUserRepository {
  return {
    existsByEmail: vi.fn().mockResolvedValue(Result.ok(emailExists)),
    save: vi.fn().mockResolvedValue(Result.ok(undefined)),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByPartnerId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as IUserRepository;
}

function createMockAuthService(): IAuthServiceRegister {
  return {
    signUp: vi.fn().mockResolvedValue(
      Result.ok({
        user: { id: 'user-abc', email: 'alice@test.com' },
        session: { accessToken: 'tok', refreshToken: 'ref', expiresAt: 9999999 },
      })
    ),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RegisterUseCase — password validation', () => {
  let userRepo: IUserRepository;
  let authService: IAuthServiceRegister;
  let useCase: RegisterUseCase;

  beforeEach(() => {
    userRepo = createMockUserRepo();
    authService = createMockAuthService();
    useCase = new RegisterUseCase(userRepo, authService);
  });

  it('succeeds with a valid, strong password', async () => {
    const result = await useCase.execute({
      email: 'alice@test.com',
      password: 'Secure@123',
      name: 'Alice',
    });
    expect(result.isOk()).toBe(true);
    expect(result.getValue().user.email).toBe('alice@test.com');
  });

  it('fails when password is missing (empty string)', async () => {
    const result = await useCase.execute({
      email: 'alice@test.com',
      password: '',
      name: 'Alice',
    });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('password');
  });

  it('fails when password is shorter than 8 characters', async () => {
    const result = await useCase.execute({
      email: 'alice@test.com',
      password: 'Sec@1',
      name: 'Alice',
    });
    expect(result.isFail()).toBe(true);
    const err = result.getError();
    expect(err.field).toBe('password');
    expect(err.message.toLowerCase()).toContain('8');
  });

  it('fails when password has no uppercase letter', async () => {
    const result = await useCase.execute({
      email: 'alice@test.com',
      password: 'secure@123',
      name: 'Alice',
    });
    expect(result.isFail()).toBe(true);
    expect(result.getError()).toBeInstanceOf(PasswordError);
    const err = result.getError() as PasswordError;
    expect(err.violations.some(v => v.toLowerCase().includes('uppercase'))).toBe(true);
  });

  it('fails when password has no lowercase letter', async () => {
    const result = await useCase.execute({
      email: 'alice@test.com',
      password: 'SECURE@123',
      name: 'Alice',
    });
    expect(result.isFail()).toBe(true);
    const err = result.getError() as PasswordError;
    expect(err.violations.some(v => v.toLowerCase().includes('lowercase'))).toBe(true);
  });

  it('fails when password has no special character', async () => {
    const result = await useCase.execute({
      email: 'alice@test.com',
      password: 'Secure1234',
      name: 'Alice',
    });
    expect(result.isFail()).toBe(true);
    const err = result.getError() as PasswordError;
    expect(err.violations.some(v => v.toLowerCase().includes('special'))).toBe(true);
  });

  it('fails when password has no number', async () => {
    const result = await useCase.execute({
      email: 'alice@test.com',
      password: 'Secure@abc',
      name: 'Alice',
    });
    expect(result.isFail()).toBe(true);
    const err = result.getError() as PasswordError;
    expect(err.violations.some(v => v.toLowerCase().includes('number'))).toBe(true);
  });

  it('does NOT call authService when password is invalid (fail fast)', async () => {
    await useCase.execute({
      email: 'alice@test.com',
      password: 'weak',
      name: 'Alice',
    });
    expect(authService.signUp).not.toHaveBeenCalled();
  });

  it('does NOT call authService when email is missing', async () => {
    await useCase.execute({
      email: '',
      password: 'Secure@123',
      name: 'Alice',
    });
    expect(authService.signUp).not.toHaveBeenCalled();
  });

  it('fails when email is already registered', async () => {
    userRepo = createMockUserRepo(true /* emailExists */);
    useCase = new RegisterUseCase(userRepo, authService);
    const result = await useCase.execute({
      email: 'existing@test.com',
      password: 'Secure@123',
      name: 'Alice',
    });
    expect(result.isFail()).toBe(true);
    expect(result.getError().message).toMatch(/already/i);
  });
});
