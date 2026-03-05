/**
 * CalendarEvent Entity Tests — TDD
 */

import { describe, it, expect } from 'vitest';
import { CalendarEvent, CalendarEventProps } from '../CalendarEvent';

const now = new Date();
const later = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour

const validProps = {
  id: 'evt-001',
  connectionId: 'conn-001',
  userId: 'user-123',
  externalId: 'google-event-abc',
  calendarId: 'primary',
  title: 'Team Lunch',
  description: 'Monthly team lunch',
  startTime: now,
  endTime: later,
  isAllDay: false,
  location: 'Restaurant Central',
  color: '#4285F4',
  provider: 'google' as const,
  etag: '"etag-abc123"',
};

describe('CalendarEvent — create()', () => {
  it('creates a valid Google calendar event', () => {
    const result = CalendarEvent.create(validProps);
    expect(result.isOk()).toBe(true);

    const event = result.getValue();
    expect(event.id).toBe('evt-001');
    expect(event.externalId).toBe('google-event-abc');
    expect(event.provider).toBe('google');
    expect(event.title).toBe('Team Lunch');
    expect(event.isAllDay).toBe(false);
  });

  it('creates a valid Apple calendar event', () => {
    const result = CalendarEvent.create({ ...validProps, provider: 'apple', id: 'evt-002' });
    expect(result.isOk()).toBe(true);
    expect(result.getValue().provider).toBe('apple');
  });

  it('sets syncedAt to current time', () => {
    const before = new Date();
    const result = CalendarEvent.create(validProps);
    const after = new Date();
    const event = result.getValue();
    expect(event.syncedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(event.syncedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('trims title whitespace', () => {
    const result = CalendarEvent.create({ ...validProps, title: '  Padded  ' });
    expect(result.getValue().title).toBe('Padded');
  });

  it('defaults isAllDay to false when not provided', () => {
    const { isAllDay: _a, ...propsWithout } = validProps;
    const result = CalendarEvent.create(propsWithout);
    expect(result.getValue().isAllDay).toBe(false);
  });

  it('fails when id is empty', () => {
    const result = CalendarEvent.create({ ...validProps, id: '' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().message).toContain('ID is required');
  });

  it('fails when connectionId is empty', () => {
    const result = CalendarEvent.create({ ...validProps, connectionId: '' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().message).toContain('Connection ID');
  });

  it('fails when userId is empty', () => {
    const result = CalendarEvent.create({ ...validProps, userId: '' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().message).toContain('User ID');
  });

  it('fails when externalId is empty', () => {
    const result = CalendarEvent.create({ ...validProps, externalId: '' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().message).toContain('External event ID');
  });

  it('fails when calendarId is empty', () => {
    const result = CalendarEvent.create({ ...validProps, calendarId: '' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().message).toContain('Calendar ID');
  });

  it('fails when title is empty', () => {
    const result = CalendarEvent.create({ ...validProps, title: '' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().message).toContain('Title is required');
  });

  it('fails when title exceeds 500 characters', () => {
    const result = CalendarEvent.create({ ...validProps, title: 'a'.repeat(501) });
    expect(result.isFail()).toBe(true);
    expect(result.getError().message).toContain('500 characters');
  });

  it('fails when provider is invalid', () => {
    const result = CalendarEvent.create({ ...validProps, provider: 'outlook' as never });
    expect(result.isFail()).toBe(true);
    expect(result.getError().message).toContain('google');
  });

  it('fails when endTime is before startTime', () => {
    const result = CalendarEvent.create({
      ...validProps,
      endTime: new Date(now.getTime() - 1000),
    });
    expect(result.isFail()).toBe(true);
    expect(result.getError().message).toContain('End time must be after');
  });

  it('allows event without endTime', () => {
    const { endTime: _e, ...propsWithout } = validProps;
    const result = CalendarEvent.create(propsWithout);
    expect(result.isOk()).toBe(true);
    expect(result.getValue().endTime).toBeUndefined();
  });
});

describe('CalendarEvent — displayColor', () => {
  it('uses Google blue when no color specified and provider is google', () => {
    const { color: _c, ...propsWithout } = validProps;
    const event = CalendarEvent.create(propsWithout).getValue();
    expect(event.displayColor).toBe('#4285F4');
  });

  it('uses Apple dark when no color specified and provider is apple', () => {
    const { color: _c, ...propsWithout } = { ...validProps, provider: 'apple' as const };
    const event = CalendarEvent.create(propsWithout).getValue();
    expect(event.displayColor).toBe('#1C1C1E');
  });

  it('uses custom color when provided', () => {
    const event = CalendarEvent.create({ ...validProps, color: '#FF5733' }).getValue();
    expect(event.displayColor).toBe('#FF5733');
  });
});

describe('CalendarEvent — isUpcoming / isPast / isOngoing', () => {
  it('isUpcoming is true for future events', () => {
    const future = new Date(Date.now() + 60 * 60 * 1000);
    const event = CalendarEvent.create({ ...validProps, startTime: future, endTime: undefined }).getValue();
    expect(event.isUpcoming).toBe(true);
    expect(event.isPast).toBe(false);
  });

  it('isPast is true when endTime is in the past', () => {
    const past = new Date(Date.now() - 60 * 60 * 1000);
    const pastEnd = new Date(Date.now() - 30 * 60 * 1000);
    const event = CalendarEvent.create({
      ...validProps,
      startTime: past,
      endTime: pastEnd,
    }).getValue();
    expect(event.isPast).toBe(true);
    expect(event.isUpcoming).toBe(false);
  });

  it('isOngoing is true when now is between start and end', () => {
    const pastStart = new Date(Date.now() - 30 * 60 * 1000);
    const futureEnd = new Date(Date.now() + 30 * 60 * 1000);
    const event = CalendarEvent.create({
      ...validProps,
      startTime: pastStart,
      endTime: futureEnd,
    }).getValue();
    expect(event.isOngoing).toBe(true);
  });
});

describe('CalendarEvent — isExportedFromCouplePlan', () => {
  it('returns false when couplePlanEventId is not set', () => {
    const event = CalendarEvent.create(validProps).getValue();
    expect(event.isExportedFromCouplePlan).toBe(false);
  });

  it('returns true when couplePlanEventId is set', () => {
    const event = CalendarEvent.create({
      ...validProps,
      couplePlanEventId: 'cp-event-001',
    }).getValue();
    expect(event.isExportedFromCouplePlan).toBe(true);
  });
});

describe('CalendarEvent — hasChangedSince()', () => {
  it('returns false when etag matches', () => {
    const event = CalendarEvent.create({ ...validProps, etag: '"abc123"' }).getValue();
    expect(event.hasChangedSince('"abc123"')).toBe(false);
  });

  it('returns true when etag differs', () => {
    const event = CalendarEvent.create({ ...validProps, etag: '"abc123"' }).getValue();
    expect(event.hasChangedSince('"different"')).toBe(true);
  });
});

describe('CalendarEvent — refresh()', () => {
  it('updates fields with new data from provider', () => {
    const event = CalendarEvent.create(validProps).getValue();
    const newTitle = 'Updated Title';
    const refreshed = event.refresh({ title: newTitle, etag: '"new-etag"' });

    expect(refreshed.title).toBe(newTitle);
    expect(refreshed.etag).toBe('"new-etag"');
    expect(refreshed.id).toBe(event.id); // ID unchanged
  });

  it('updates syncedAt', () => {
    const event = CalendarEvent.create(validProps).getValue();
    const before = new Date();
    const refreshed = event.refresh({ title: 'New' });
    const after = new Date();
    expect(refreshed.syncedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(refreshed.syncedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('keeps unchanged fields when not provided in update', () => {
    const event = CalendarEvent.create(validProps).getValue();
    const refreshed = event.refresh({ title: 'New Title' });
    expect(refreshed.location).toBe('Restaurant Central');
    expect(refreshed.provider).toBe('google');
  });
});

describe('CalendarEvent — reconstitute()', () => {
  it('reconstitutes from persistence data', () => {
    const props: CalendarEventProps = {
      ...validProps,
      syncedAt: new Date('2026-01-01'),
    };
    const event = CalendarEvent.reconstitute(props);
    expect(event.id).toBe('evt-001');
    expect(event.syncedAt).toEqual(new Date('2026-01-01'));
  });
});

describe('CalendarEvent — equals()', () => {
  it('returns true for same ID', () => {
    const a = CalendarEvent.create(validProps).getValue();
    const b = CalendarEvent.create(validProps).getValue();
    expect(a.equals(b)).toBe(true);
  });

  it('returns false for different IDs', () => {
    const a = CalendarEvent.create(validProps).getValue();
    const b = CalendarEvent.create({ ...validProps, id: 'evt-002' }).getValue();
    expect(a.equals(b)).toBe(false);
  });
});

describe('CalendarEvent — toJSON()', () => {
  it('returns all props as plain object', () => {
    const event = CalendarEvent.create(validProps).getValue();
    const json = event.toJSON();
    expect(json.id).toBe('evt-001');
    expect(json.provider).toBe('google');
    expect(json.syncedAt).toBeInstanceOf(Date);
  });
});
