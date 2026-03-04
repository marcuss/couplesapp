/**
 * DisconnectCalendarUseCase Tests — TDD
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DisconnectCalendarUseCase, DisconnectCalendarDTO } from '../DisconnectCalendarUseCase';
import { ICalendarConnectionRepository } from '../../../../domain/repositories/ICalendarConnectionRepository';
import { ICalendarEventRepository } from '../../../../domain/repositories/ICalendarEventRepository';
import { CalendarConnection } from '../../../../domain/entities/CalendarConnection';
import { Result } from '../../../../shared/utils/Result';
import {
  NotFoundError,
  UnauthorizedError,
  DatabaseError,
} from '../../../../domain/errors/DomainError';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const userId = 'user-123';
const connectionId = 'conn-001';

function makeConnection(ownerId = userId): CalendarConnection {
  return CalendarConnection.reconstitute({
    id: connectionId,
    userId: ownerId,
    provider: 'google',
    providerAccountEmail: 'user@gmail.com',
    isActive: true,
    selectedCalendars: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function makeConnRepo(
  overrides: Partial<ICalendarConnectionRepository> = {}
): ICalendarConnectionRepository {
  return {
    findById: vi.fn().mockResolvedValue(Result.ok(makeConnection())),
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

function makeEventRepo(
  overrides: Partial<ICalendarEventRepository> = {}
): ICalendarEventRepository {
  return {
    findById: vi.fn().mockResolvedValue(Result.ok(null)),
    findByExternalId: vi.fn().mockResolvedValue(Result.ok(null)),
    findByUserAndDateRange: vi.fn().mockResolvedValue(Result.ok([])),
    findByConnection: vi.fn().mockResolvedValue(Result.ok([])),
    findByUserAndProvider: vi.fn().mockResolvedValue(Result.ok([])),
    findForCouple: vi.fn().mockResolvedValue(Result.ok([])),
    save: vi.fn().mockResolvedValue(Result.ok(undefined)),
    saveMany: vi.fn().mockResolvedValue(Result.ok(undefined)),
    update: vi.fn().mockResolvedValue(Result.ok(undefined)),
    delete: vi.fn().mockResolvedValue(Result.ok(undefined)),
    deleteByConnection: vi.fn().mockResolvedValue(Result.ok(undefined)),
    deleteByUser: vi.fn().mockResolvedValue(Result.ok(undefined)),
    countByConnection: vi.fn().mockResolvedValue(Result.ok(0)),
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('DisconnectCalendarUseCase — execute()', () => {
  let connRepo: ICalendarConnectionRepository;
  let eventRepo: ICalendarEventRepository;
  let useCase: DisconnectCalendarUseCase;

  const validDTO: DisconnectCalendarDTO = { userId, connectionId };

  beforeEach(() => {
    connRepo = makeConnRepo();
    eventRepo = makeEventRepo();
    useCase = new DisconnectCalendarUseCase(connRepo, eventRepo);
  });

  it('successfully disconnects a calendar', async () => {
    const result = await useCase.execute(validDTO);

    expect(result.isOk()).toBe(true);
    const data = result.getValue();
    expect(data.disconnected).toBe(true);
    expect(data.connectionId).toBe(connectionId);
    expect(data.provider).toBe('google');
  });

  it('deletes cached events before deleting connection', async () => {
    await useCase.execute(validDTO);

    expect(eventRepo.deleteByConnection).toHaveBeenCalledWith(connectionId);
    expect(connRepo.delete).toHaveBeenCalledWith(connectionId);

    // deleteByConnection should be called before delete
    const eventDeleteOrder = vi.mocked(eventRepo.deleteByConnection).mock.invocationCallOrder[0];
    const connDeleteOrder = vi.mocked(connRepo.delete).mock.invocationCallOrder[0];
    expect(eventDeleteOrder).toBeLessThan(connDeleteOrder);
  });

  it('returns NotFoundError when connection does not exist', async () => {
    connRepo = makeConnRepo({
      findById: vi.fn().mockResolvedValue(Result.ok(null)),
    });
    useCase = new DisconnectCalendarUseCase(connRepo, eventRepo);

    const result = await useCase.execute(validDTO);
    expect(result.isFail()).toBe(true);
    expect(result.getError()).toBeInstanceOf(NotFoundError);
  });

  it('returns UnauthorizedError when userId does not match connection owner', async () => {
    connRepo = makeConnRepo({
      findById: vi.fn().mockResolvedValue(Result.ok(makeConnection('other-user'))),
    });
    useCase = new DisconnectCalendarUseCase(connRepo, eventRepo);

    const result = await useCase.execute({ ...validDTO, userId: 'different-user' });
    expect(result.isFail()).toBe(true);
    expect(result.getError()).toBeInstanceOf(UnauthorizedError);
  });

  it('does NOT delete when user is not authorized', async () => {
    connRepo = makeConnRepo({
      findById: vi.fn().mockResolvedValue(Result.ok(makeConnection('other-user'))),
    });
    useCase = new DisconnectCalendarUseCase(connRepo, eventRepo);

    await useCase.execute({ ...validDTO, userId: 'different-user' });
    expect(connRepo.delete).not.toHaveBeenCalled();
    expect(eventRepo.deleteByConnection).not.toHaveBeenCalled();
  });

  it('propagates DB error from findById', async () => {
    connRepo = makeConnRepo({
      findById: vi.fn().mockResolvedValue(Result.fail(new DatabaseError('DB error'))),
    });
    useCase = new DisconnectCalendarUseCase(connRepo, eventRepo);

    const result = await useCase.execute(validDTO);
    expect(result.isFail()).toBe(true);
    expect(result.getError()).toBeInstanceOf(DatabaseError);
  });

  it('propagates DB error from deleteByConnection', async () => {
    eventRepo = makeEventRepo({
      deleteByConnection: vi
        .fn()
        .mockResolvedValue(Result.fail(new DatabaseError('Delete failed'))),
    });
    useCase = new DisconnectCalendarUseCase(connRepo, eventRepo);

    const result = await useCase.execute(validDTO);
    expect(result.isFail()).toBe(true);
  });

  it('propagates DB error from connection delete', async () => {
    connRepo = makeConnRepo({
      delete: vi.fn().mockResolvedValue(Result.fail(new DatabaseError('Delete failed'))),
    });
    useCase = new DisconnectCalendarUseCase(connRepo, eventRepo);

    const result = await useCase.execute(validDTO);
    expect(result.isFail()).toBe(true);
  });

  // ─── Validation ───────────────────────────────────────────────────────────

  it('fails when userId is empty', async () => {
    const result = await useCase.execute({ ...validDTO, userId: '' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().message).toContain('User ID');
  });

  it('fails when connectionId is empty', async () => {
    const result = await useCase.execute({ ...validDTO, connectionId: '' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().message).toContain('Connection ID');
  });
});
