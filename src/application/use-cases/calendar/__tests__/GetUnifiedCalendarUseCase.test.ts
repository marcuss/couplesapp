/**
 * GetUnifiedCalendarUseCase Tests — TDD
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GetUnifiedCalendarUseCase,
  GetUnifiedCalendarDTO,
} from '../GetUnifiedCalendarUseCase';
import { IEventRepository } from '../../../../domain/repositories/IEventRepository';
import { ICalendarEventRepository } from '../../../../domain/repositories/ICalendarEventRepository';
import { Event } from '../../../../domain/entities/Event';
import { CalendarEvent } from '../../../../domain/entities/CalendarEvent';
import { Result } from '../../../../shared/utils/Result';
import { DatabaseError, ValidationError } from '../../../../domain/errors/DomainError';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const userId = 'user-123';
const partnerId = 'partner-456';

function makeNativeEvent(overrides: Partial<Parameters<typeof Event['create']>[0]> = {}): Event {
  return Event.reconstitute({
    id: 'native-evt-001',
    title: 'Date Night',
    startDate: new Date('2026-04-01T19:00:00'),
    endDate: new Date('2026-04-01T22:00:00'),
    type: 'date',
    isAllDay: false,
    createdBy: userId,
    partnerId,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function makeCalendarEvent(overrides: Partial<Parameters<typeof CalendarEvent['create']>[0]> = {}): CalendarEvent {
  return CalendarEvent.reconstitute({
    id: 'ext-evt-001',
    connectionId: 'conn-001',
    userId,
    externalId: 'google-abc',
    calendarId: 'primary',
    title: 'Doctor Appointment',
    startTime: new Date('2026-04-02T10:00:00'),
    isAllDay: false,
    provider: 'google',
    syncedAt: new Date(),
    ...overrides,
  });
}

function makeEventRepo(
  overrides: Partial<IEventRepository> = {}
): IEventRepository {
  return {
    findById: vi.fn().mockResolvedValue(Result.ok(null)),
    findByCouple: vi.fn().mockResolvedValue(Result.ok([makeNativeEvent()])),
    findByType: vi.fn().mockResolvedValue(Result.ok([])),
    findByDateRange: vi.fn().mockResolvedValue(Result.ok([makeNativeEvent()])),
    findUpcoming: vi.fn().mockResolvedValue(Result.ok([])),
    findOngoing: vi.fn().mockResolvedValue(Result.ok([])),
    findPast: vi.fn().mockResolvedValue(Result.ok([])),
    findByCreator: vi.fn().mockResolvedValue(Result.ok([])),
    save: vi.fn().mockResolvedValue(Result.ok(undefined)),
    update: vi.fn().mockResolvedValue(Result.ok(undefined)),
    delete: vi.fn().mockResolvedValue(Result.ok(undefined)),
    hasOverlappingEvents: vi.fn().mockResolvedValue(Result.ok(false)),
    findOverlapping: vi.fn().mockResolvedValue(Result.ok([])),
    ...overrides,
  };
}

function makeCalEventRepo(
  overrides: Partial<ICalendarEventRepository> = {}
): ICalendarEventRepository {
  return {
    findById: vi.fn().mockResolvedValue(Result.ok(null)),
    findByExternalId: vi.fn().mockResolvedValue(Result.ok(null)),
    findByUserAndDateRange: vi.fn().mockResolvedValue(Result.ok([])),
    findByConnection: vi.fn().mockResolvedValue(Result.ok([])),
    findByUserAndProvider: vi.fn().mockResolvedValue(Result.ok([])),
    findForCouple: vi.fn().mockResolvedValue(Result.ok([makeCalendarEvent()])),
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

describe('GetUnifiedCalendarUseCase — execute()', () => {
  let eventRepo: IEventRepository;
  let calEventRepo: ICalendarEventRepository;
  let useCase: GetUnifiedCalendarUseCase;

  const validDTO: GetUnifiedCalendarDTO = { userId, partnerId };

  beforeEach(() => {
    eventRepo = makeEventRepo();
    calEventRepo = makeCalEventRepo();
    useCase = new GetUnifiedCalendarUseCase(eventRepo, calEventRepo);
  });

  it('returns unified events from CouplePlan and external calendars', async () => {
    const result = await useCase.execute(validDTO);

    expect(result.isOk()).toBe(true);
    const data = result.getValue();
    expect(data.totalCount).toBe(2); // 1 native + 1 external
  });

  it('assigns correct source to CouplePlan events', async () => {
    const result = await useCase.execute(validDTO);
    const nativeEvents = result.getValue().events.filter((e) => e.source === 'coupleplan');
    expect(nativeEvents).toHaveLength(1);
    expect(nativeEvents[0].isEditable).toBe(true);
  });

  it('assigns correct source to Google events', async () => {
    const result = await useCase.execute(validDTO);
    const googleEvents = result.getValue().events.filter((e) => e.source === 'google');
    expect(googleEvents).toHaveLength(1);
    expect(googleEvents[0].isEditable).toBe(false);
  });

  it('assigns CouplePlan rose color to native events', async () => {
    const result = await useCase.execute(validDTO);
    const nativeEvent = result.getValue().events.find((e) => e.source === 'coupleplan');
    expect(nativeEvent?.color).toBe('#f43f5e');
  });

  it('assigns Google blue color to Google events', async () => {
    const result = await useCase.execute(validDTO);
    const googleEvent = result.getValue().events.find((e) => e.source === 'google');
    expect(googleEvent?.color).toBe('#4285F4');
  });

  it('sorts events by startTime ascending', async () => {
    // native event: 2026-04-01, external: 2026-04-02
    const result = await useCase.execute(validDTO);
    const events = result.getValue().events;
    for (let i = 1; i < events.length; i++) {
      expect(events[i].startTime.getTime()).toBeGreaterThanOrEqual(
        events[i - 1].startTime.getTime()
      );
    }
  });

  it('returns bySource counts', async () => {
    const result = await useCase.execute(validDTO);
    const { bySource } = result.getValue();
    expect(bySource.coupleplan).toBe(1);
    expect(bySource.google).toBe(1);
  });

  it('filters by source when sources array is provided', async () => {
    const result = await useCase.execute({
      ...validDTO,
      sources: ['coupleplan'],
    });

    expect(result.isOk()).toBe(true);
    const events = result.getValue().events;
    expect(events.every((e) => e.source === 'coupleplan')).toBe(true);
    expect(calEventRepo.findForCouple).not.toHaveBeenCalled();
  });

  it('filters only Google events when sources = [google]', async () => {
    const result = await useCase.execute({
      ...validDTO,
      sources: ['google'],
    });

    expect(result.isOk()).toBe(true);
    expect(eventRepo.findByCouple).not.toHaveBeenCalled();
    const events = result.getValue().events;
    expect(events.every((e) => e.source === 'google')).toBe(true);
  });

  it('uses findByDateRange when startDate + endDate provided', async () => {
    const startDate = new Date('2026-04-01');
    const endDate = new Date('2026-04-30');

    await useCase.execute({ ...validDTO, startDate, endDate });
    expect(eventRepo.findByDateRange).toHaveBeenCalledWith(
      userId,
      partnerId,
      startDate,
      endDate
    );
    expect(eventRepo.findByCouple).not.toHaveBeenCalled();
  });

  it('uses findByCouple when no date range provided', async () => {
    await useCase.execute(validDTO);
    expect(eventRepo.findByCouple).toHaveBeenCalledWith(userId, partnerId);
    expect(eventRepo.findByDateRange).not.toHaveBeenCalled();
  });

  it('prefixes event IDs with source to prevent collisions', async () => {
    const result = await useCase.execute(validDTO);
    const native = result.getValue().events.find((e) => e.source === 'coupleplan');
    const external = result.getValue().events.find((e) => e.source === 'google');
    expect(native?.id).toMatch(/^coupleplan:/);
    expect(external?.id).toMatch(/^external:/);
  });

  it('includes externalId for external events', async () => {
    const result = await useCase.execute(validDTO);
    const external = result.getValue().events.find((e) => e.source === 'google');
    expect(external?.externalId).toBe('google-abc');
  });

  it('returns empty results when user has no events', async () => {
    eventRepo = makeEventRepo({
      findByCouple: vi.fn().mockResolvedValue(Result.ok([])),
    });
    calEventRepo = makeCalEventRepo({
      findForCouple: vi.fn().mockResolvedValue(Result.ok([])),
    });
    useCase = new GetUnifiedCalendarUseCase(eventRepo, calEventRepo);

    const result = await useCase.execute(validDTO);
    expect(result.isOk()).toBe(true);
    expect(result.getValue().totalCount).toBe(0);
    expect(result.getValue().events).toEqual([]);
  });

  it('propagates DB error from event repository', async () => {
    eventRepo = makeEventRepo({
      findByCouple: vi.fn().mockResolvedValue(Result.fail(new DatabaseError('DB error'))),
    });
    useCase = new GetUnifiedCalendarUseCase(eventRepo, calEventRepo);

    const result = await useCase.execute(validDTO);
    expect(result.isFail()).toBe(true);
    expect(result.getError()).toBeInstanceOf(DatabaseError);
  });

  it('propagates DB error from calendar event repository', async () => {
    calEventRepo = makeCalEventRepo({
      findForCouple: vi.fn().mockResolvedValue(Result.fail(new DatabaseError('Cache error'))),
    });
    useCase = new GetUnifiedCalendarUseCase(eventRepo, calEventRepo);

    const result = await useCase.execute(validDTO);
    expect(result.isFail()).toBe(true);
  });

  // ─── Validation ───────────────────────────────────────────────────────────

  it('fails when userId is empty', async () => {
    const result = await useCase.execute({ userId: '', partnerId });
    expect(result.isFail()).toBe(true);
    expect(result.getError()).toBeInstanceOf(ValidationError);
    expect(result.getError().message).toContain('User ID');
  });

  it('fails when partnerId is empty', async () => {
    const result = await useCase.execute({ userId, partnerId: '' });
    expect(result.isFail()).toBe(true);
    expect(result.getError()).toBeInstanceOf(ValidationError);
    expect(result.getError().message).toContain('Partner ID');
  });
});
