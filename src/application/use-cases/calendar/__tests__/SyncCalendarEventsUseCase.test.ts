/**
 * SyncCalendarEventsUseCase Tests — TDD
 * All external API calls are mocked via ICalendarApiAdapter.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SyncCalendarEventsUseCase,
  SyncCalendarEventsDTO,
  ICalendarApiAdapter,
  ExternalEventData,
} from '../SyncCalendarEventsUseCase';
import { ICalendarConnectionRepository } from '../../../../domain/repositories/ICalendarConnectionRepository';
import { ICalendarEventRepository } from '../../../../domain/repositories/ICalendarEventRepository';
import { CalendarConnection } from '../../../../domain/entities/CalendarConnection';
import { CalendarEvent } from '../../../../domain/entities/CalendarEvent';
import { Result } from '../../../../shared/utils/Result';
import {
  NotFoundError,
  UnauthorizedError,
  DatabaseError,
  ValidationError,
} from '../../../../domain/errors/DomainError';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const userId = 'user-123';
const connectionId = 'conn-001';

const mockIdGenerator = {
  generate: vi.fn().mockReturnValue('new-id-001'),
};

function makeConnection(overrides: Partial<ReturnType<CalendarConnection['toJSON']>> = {}): CalendarConnection {
  return CalendarConnection.reconstitute({
    id: connectionId,
    userId,
    provider: 'google',
    isActive: true,
    selectedCalendars: [
      { id: 'primary', name: 'Personal', color: '#4285F4', enabled: true },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function makeCachedEvent(externalId: string, etag = '"old-etag"'): CalendarEvent {
  return CalendarEvent.reconstitute({
    id: 'cached-evt-001',
    connectionId,
    userId,
    externalId,
    calendarId: 'primary',
    title: 'Old Title',
    startTime: new Date(),
    isAllDay: false,
    provider: 'google',
    etag,
    syncedAt: new Date(),
  });
}

const externalEventData: ExternalEventData = {
  externalId: 'google-event-abc',
  calendarId: 'primary',
  title: 'Team Meeting',
  startTime: new Date(Date.now() + 3600 * 1000),
  endTime: new Date(Date.now() + 7200 * 1000),
  etag: '"new-etag"',
};

function makeConnRepo(
  overrides: Partial<ICalendarConnectionRepository> = {}
): ICalendarConnectionRepository {
  return {
    findById: vi.fn().mockResolvedValue(Result.ok(makeConnection())),
    findByUserAndProvider: vi.fn().mockResolvedValue(Result.ok(null)),
    findActiveByUser: vi.fn().mockResolvedValue(Result.ok([makeConnection()])),
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
    findByExternalId: vi.fn().mockResolvedValue(Result.ok(null)), // not cached by default
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

function makeApiAdapter(events = [externalEventData]): ICalendarApiAdapter {
  return {
    fetchEvents: vi.fn().mockResolvedValue(events),
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('SyncCalendarEventsUseCase — execute()', () => {
  let connRepo: ICalendarConnectionRepository;
  let eventRepo: ICalendarEventRepository;
  let apiAdapter: ICalendarApiAdapter;
  let useCase: SyncCalendarEventsUseCase;

  const validDTO: SyncCalendarEventsDTO = { userId };

  beforeEach(() => {
    mockIdGenerator.generate.mockReturnValue('new-id-001');
    connRepo = makeConnRepo();
    eventRepo = makeEventRepo();
    apiAdapter = makeApiAdapter();
    useCase = new SyncCalendarEventsUseCase(connRepo, eventRepo, apiAdapter, mockIdGenerator);
  });

  it('syncs events from all active connections', async () => {
    const result = await useCase.execute(validDTO);

    expect(result.isOk()).toBe(true);
    const data = result.getValue();
    expect(data.syncedConnections).toBe(1);
    expect(data.eventsPulled).toBe(1); // new event created
    expect(data.errors).toHaveLength(0);
  });

  it('calls fetchEvents with correct calendar IDs', async () => {
    await useCase.execute(validDTO);
    expect(apiAdapter.fetchEvents).toHaveBeenCalledWith(
      connectionId,
      ['primary'],
      expect.any(Date),
      expect.any(Date)
    );
  });

  it('saves new events via saveMany', async () => {
    await useCase.execute(validDTO);
    expect(eventRepo.saveMany).toHaveBeenCalledOnce();
  });

  it('skips events whose etag has not changed', async () => {
    // Cached event already exists with same etag
    const cachedEvt = makeCachedEvent('google-event-abc', '"new-etag"');
    eventRepo = makeEventRepo({
      findByExternalId: vi.fn().mockResolvedValue(Result.ok(cachedEvt)),
    });
    useCase = new SyncCalendarEventsUseCase(connRepo, eventRepo, apiAdapter, mockIdGenerator);

    const result = await useCase.execute(validDTO);
    expect(result.isOk()).toBe(true);
    const data = result.getValue();
    expect(data.eventsSkipped).toBe(1);
    expect(data.eventsPulled).toBe(0);
  });

  it('updates existing events when etag has changed', async () => {
    // Cached event exists with different etag
    const cachedEvt = makeCachedEvent('google-event-abc', '"old-etag"');
    eventRepo = makeEventRepo({
      findByExternalId: vi.fn().mockResolvedValue(Result.ok(cachedEvt)),
    });
    useCase = new SyncCalendarEventsUseCase(connRepo, eventRepo, apiAdapter, mockIdGenerator);

    const result = await useCase.execute(validDTO);
    const data = result.getValue();
    expect(data.eventsPulled).toBe(1); // updated
    expect(data.eventsSkipped).toBe(0);
  });

  it('syncs only specified connection when connectionId is provided', async () => {
    const result = await useCase.execute({ ...validDTO, connectionId });

    expect(result.isOk()).toBe(true);
    expect(connRepo.findById).toHaveBeenCalledWith(connectionId);
    expect(connRepo.findActiveByUser).not.toHaveBeenCalled();
  });

  it('returns NotFoundError when specified connectionId does not exist', async () => {
    connRepo = makeConnRepo({
      findById: vi.fn().mockResolvedValue(Result.ok(null)),
    });
    useCase = new SyncCalendarEventsUseCase(connRepo, eventRepo, apiAdapter, mockIdGenerator);

    const result = await useCase.execute({ ...validDTO, connectionId: 'nonexistent' });
    expect(result.isFail()).toBe(true);
    expect(result.getError()).toBeInstanceOf(NotFoundError);
  });

  it('returns UnauthorizedError when connection belongs to another user', async () => {
    connRepo = makeConnRepo({
      findById: vi.fn().mockResolvedValue(
        Result.ok(makeConnection({ userId: 'other-user' }))
      ),
    });
    useCase = new SyncCalendarEventsUseCase(connRepo, eventRepo, apiAdapter, mockIdGenerator);

    const result = await useCase.execute({ ...validDTO, connectionId });
    expect(result.isFail()).toBe(true);
    expect(result.getError()).toBeInstanceOf(UnauthorizedError);
  });

  it('skips connection with no enabled calendars (sync 0 events)', async () => {
    const connWithNoEnabled = makeConnection({
      selectedCalendars: [{ id: 'cal-1', name: 'Work', color: '#f00', enabled: false }],
    });
    connRepo = makeConnRepo({
      findActiveByUser: vi.fn().mockResolvedValue(Result.ok([connWithNoEnabled])),
    });
    useCase = new SyncCalendarEventsUseCase(connRepo, eventRepo, apiAdapter, mockIdGenerator);

    const result = await useCase.execute(validDTO);
    expect(result.isOk()).toBe(true);
    expect(apiAdapter.fetchEvents).not.toHaveBeenCalled();
    expect(result.getValue().syncedConnections).toBe(1);
    expect(result.getValue().eventsPulled).toBe(0);
  });

  it('records errors when API adapter throws', async () => {
    apiAdapter = {
      fetchEvents: vi.fn().mockRejectedValue(new Error('Google API down')),
    };
    useCase = new SyncCalendarEventsUseCase(connRepo, eventRepo, apiAdapter, mockIdGenerator);

    const result = await useCase.execute(validDTO);
    expect(result.isOk()).toBe(true); // non-fatal errors
    const data = result.getValue();
    expect(data.errors).toHaveLength(1);
    expect(data.errors[0].error).toContain('Google API down');
    expect(data.syncedConnections).toBe(0);
  });

  it('calls recordSync on connection after successful sync', async () => {
    await useCase.execute(validDTO);
    expect(connRepo.update).toHaveBeenCalledOnce();
    const updatedConn = vi.mocked(connRepo.update).mock.calls[0][0];
    expect(updatedConn.lastSyncedAt).toBeDefined();
  });

  it('returns ValidationError when userId is empty', async () => {
    const result = await useCase.execute({ userId: '' });
    expect(result.isFail()).toBe(true);
    expect(result.getError()).toBeInstanceOf(ValidationError);
  });

  it('handles multiple connections', async () => {
    const conn2 = makeConnection({ id: 'conn-002', userId, provider: 'apple' });
    connRepo = makeConnRepo({
      findActiveByUser: vi.fn().mockResolvedValue(Result.ok([makeConnection(), conn2])),
    });
    apiAdapter = makeApiAdapter([externalEventData]);
    useCase = new SyncCalendarEventsUseCase(connRepo, eventRepo, apiAdapter, mockIdGenerator);

    const result = await useCase.execute(validDTO);
    expect(result.isOk()).toBe(true);
    expect(result.getValue().syncedConnections).toBe(2);
  });
});
