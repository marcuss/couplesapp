/**
 * ConnectGoogleCalendarUseCase Tests — TDD
 * Uses mocks for repositories (no real DB calls)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ConnectGoogleCalendarUseCase,
  ConnectGoogleCalendarDTO,
} from '../ConnectGoogleCalendarUseCase';
import { ICalendarConnectionRepository } from '../../../../domain/repositories/ICalendarConnectionRepository';
import { Result } from '../../../../shared/utils/Result';
import { CalendarInfo } from '../../../../domain/entities/CalendarConnection';
import { ConflictError, DatabaseError } from '../../../../domain/errors/DomainError';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockIdGenerator = { generate: () => 'generated-id-001' };

const mockCalendars: CalendarInfo[] = [
  { id: 'primary', name: 'Personal', color: '#4285F4', enabled: true },
  { id: 'work@company.com', name: 'Work', color: '#0F9D58', enabled: true },
];

const validDTO: ConnectGoogleCalendarDTO = {
  userId: 'user-123',
  providerAccountEmail: 'user@gmail.com',
  availableCalendars: mockCalendars,
  tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
};

function makeRepo(
  overrides: Partial<ICalendarConnectionRepository> = {}
): ICalendarConnectionRepository {
  return {
    findById: vi.fn().mockResolvedValue(Result.ok(null)),
    findByUserAndProvider: vi.fn().mockResolvedValue(Result.ok(null)),
    findActiveByUser: vi.fn().mockResolvedValue(Result.ok([])),
    findAllByUser: vi.fn().mockResolvedValue(Result.ok([])),
    findWithExpiringWebhooks: vi.fn().mockResolvedValue(Result.ok([])),
    save: vi.fn().mockResolvedValue(Result.ok(undefined)),
    update: vi.fn().mockResolvedValue(Result.ok(undefined)),
    delete: vi.fn().mockResolvedValue(Result.ok(undefined)),
    existsForUserAndProvider: vi.fn().mockResolvedValue(Result.ok(false)),
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ConnectGoogleCalendarUseCase — execute()', () => {
  let repo: ICalendarConnectionRepository;
  let useCase: ConnectGoogleCalendarUseCase;

  beforeEach(() => {
    repo = makeRepo();
    useCase = new ConnectGoogleCalendarUseCase(repo, mockIdGenerator);
  });

  it('successfully connects Google Calendar', async () => {
    const result = await useCase.execute(validDTO);

    expect(result.isOk()).toBe(true);
    const data = result.getValue();
    expect(data.provider).toBe('google');
    expect(data.providerAccountEmail).toBe('user@gmail.com');
    expect(data.availableCalendars).toHaveLength(2);
    expect(data.connectionId).toBeDefined();
  });

  it('calls repository.save once', async () => {
    await useCase.execute(validDTO);
    expect(repo.save).toHaveBeenCalledOnce();
  });

  it('calls existsForUserAndProvider with correct args', async () => {
    await useCase.execute(validDTO);
    expect(repo.existsForUserAndProvider).toHaveBeenCalledWith('user-123', 'google');
  });

  it('returns ConflictError when Google is already connected', async () => {
    repo = makeRepo({
      existsForUserAndProvider: vi.fn().mockResolvedValue(Result.ok(true)),
    });
    useCase = new ConnectGoogleCalendarUseCase(repo, mockIdGenerator);

    const result = await useCase.execute(validDTO);
    expect(result.isFail()).toBe(true);
    expect(result.getError()).toBeInstanceOf(ConflictError);
    expect(result.getError().message).toContain('already connected');
  });

  it('does NOT call save when connection already exists', async () => {
    repo = makeRepo({
      existsForUserAndProvider: vi.fn().mockResolvedValue(Result.ok(true)),
    });
    useCase = new ConnectGoogleCalendarUseCase(repo, mockIdGenerator);

    await useCase.execute(validDTO);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('propagates DB errors from existsForUserAndProvider', async () => {
    repo = makeRepo({
      existsForUserAndProvider: vi
        .fn()
        .mockResolvedValue(Result.fail(new DatabaseError('DB down'))),
    });
    useCase = new ConnectGoogleCalendarUseCase(repo, mockIdGenerator);

    const result = await useCase.execute(validDTO);
    expect(result.isFail()).toBe(true);
    expect(result.getError()).toBeInstanceOf(DatabaseError);
  });

  it('propagates DB errors from save', async () => {
    repo = makeRepo({
      save: vi.fn().mockResolvedValue(Result.fail(new DatabaseError('Save failed'))),
    });
    useCase = new ConnectGoogleCalendarUseCase(repo, mockIdGenerator);

    const result = await useCase.execute(validDTO);
    expect(result.isFail()).toBe(true);
  });

  // ─── Validation ───────────────────────────────────────────────────────────

  it('fails when userId is empty', async () => {
    const result = await useCase.execute({ ...validDTO, userId: '' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().message).toContain('User ID');
  });

  it('fails when providerAccountEmail is empty', async () => {
    const result = await useCase.execute({ ...validDTO, providerAccountEmail: '' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().message).toContain('email');
  });

  it('fails when providerAccountEmail is malformed', async () => {
    const result = await useCase.execute({
      ...validDTO,
      providerAccountEmail: 'not-an-email',
    });
    expect(result.isFail()).toBe(true);
    expect(result.getError().message).toContain('invalid');
  });

  it('fails when availableCalendars is not an array', async () => {
    const result = await useCase.execute({
      ...validDTO,
      availableCalendars: null as never,
    });
    expect(result.isFail()).toBe(true);
  });

  it('succeeds with empty availableCalendars array', async () => {
    const result = await useCase.execute({ ...validDTO, availableCalendars: [] });
    expect(result.isOk()).toBe(true);
    expect(result.getValue().availableCalendars).toEqual([]);
  });

  it('sets all calendars to enabled by default', async () => {
    const calendars: CalendarInfo[] = [
      { id: 'cal-1', name: 'Personal', color: '#ff0000', enabled: true },
    ];
    const result = await useCase.execute({ ...validDTO, availableCalendars: calendars });
    expect(result.isOk()).toBe(true);
    expect(result.getValue().availableCalendars[0].enabled).toBe(true);
  });
});
