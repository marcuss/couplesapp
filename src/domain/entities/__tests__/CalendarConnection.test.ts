/**
 * CalendarConnection Entity Tests — TDD
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CalendarConnection, CalendarConnectionProps } from '../CalendarConnection';

const validProps = {
  id: 'conn-001',
  userId: 'user-123',
  provider: 'google' as const,
  providerAccountEmail: 'user@gmail.com',
};

describe('CalendarConnection — create()', () => {
  it('creates a valid Google connection', () => {
    const result = CalendarConnection.create(validProps);
    expect(result.isOk()).toBe(true);

    const conn = result.getValue();
    expect(conn.id).toBe('conn-001');
    expect(conn.userId).toBe('user-123');
    expect(conn.provider).toBe('google');
    expect(conn.providerAccountEmail).toBe('user@gmail.com');
    expect(conn.isActive).toBe(true);
    expect(conn.selectedCalendars).toEqual([]);
  });

  it('creates a valid Apple connection', () => {
    const result = CalendarConnection.create({ ...validProps, provider: 'apple' });
    expect(result.isOk()).toBe(true);
    expect(result.getValue().provider).toBe('apple');
  });

  it('sets isActive to true by default', () => {
    const result = CalendarConnection.create(validProps);
    expect(result.getValue().isActive).toBe(true);
  });

  it('sets selectedCalendars to empty array by default', () => {
    const result = CalendarConnection.create(validProps);
    expect(result.getValue().selectedCalendars).toEqual([]);
  });

  it('fails when id is empty', () => {
    const result = CalendarConnection.create({ ...validProps, id: '' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().message).toContain('ID is required');
  });

  it('fails when id is whitespace', () => {
    const result = CalendarConnection.create({ ...validProps, id: '   ' });
    expect(result.isFail()).toBe(true);
  });

  it('fails when userId is empty', () => {
    const result = CalendarConnection.create({ ...validProps, userId: '' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().message).toContain('User ID is required');
  });

  it('fails when provider is invalid', () => {
    const result = CalendarConnection.create({
      ...validProps,
      provider: 'outlook' as never,
    });
    expect(result.isFail()).toBe(true);
    expect(result.getError().message).toContain('google');
  });

  it('fails when providerAccountEmail is malformed', () => {
    const result = CalendarConnection.create({
      ...validProps,
      providerAccountEmail: 'not-an-email',
    });
    expect(result.isFail()).toBe(true);
    expect(result.getError().message).toContain('invalid');
  });

  it('allows missing providerAccountEmail', () => {
    const { providerAccountEmail: _e, ...propsWithoutEmail } = validProps;
    const result = CalendarConnection.create(propsWithoutEmail);
    expect(result.isOk()).toBe(true);
    expect(result.getValue().providerAccountEmail).toBeUndefined();
  });

  it('sets createdAt and updatedAt to current time', () => {
    const before = new Date();
    const result = CalendarConnection.create(validProps);
    const after = new Date();
    const conn = result.getValue();
    expect(conn.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(conn.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(conn.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});

describe('CalendarConnection — reconstitute()', () => {
  const baseProps: CalendarConnectionProps = {
    id: 'conn-001',
    userId: 'user-123',
    provider: 'google',
    providerAccountEmail: 'user@gmail.com',
    isActive: true,
    selectedCalendars: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  it('reconstitutes a connection from persistence without validation', () => {
    const conn = CalendarConnection.reconstitute(baseProps);
    expect(conn.id).toBe('conn-001');
    expect(conn.isActive).toBe(true);
  });
});

describe('CalendarConnection — updateSelectedCalendars()', () => {
  it('updates the list of available calendars', () => {
    const conn = CalendarConnection.create(validProps).getValue();
    const calendars = [
      { id: 'cal-1', name: 'Personal', color: '#ff0000', enabled: true },
      { id: 'cal-2', name: 'Work', color: '#0000ff', enabled: false },
    ];

    const result = conn.updateSelectedCalendars(calendars);
    expect(result.isOk()).toBe(true);
    expect(result.getValue().selectedCalendars).toHaveLength(2);
  });

  it('fails when calendars is not an array', () => {
    const conn = CalendarConnection.create(validProps).getValue();
    const result = conn.updateSelectedCalendars(null as never);
    expect(result.isFail()).toBe(true);
  });
});

describe('CalendarConnection — toggleCalendar()', () => {
  let conn: CalendarConnection;

  beforeEach(() => {
    const base = CalendarConnection.create(validProps).getValue();
    const calendars = [
      { id: 'cal-1', name: 'Personal', color: '#ff0000', enabled: true },
      { id: 'cal-2', name: 'Work', color: '#0000ff', enabled: false },
    ];
    conn = base.updateSelectedCalendars(calendars).getValue();
  });

  it('toggles an enabled calendar to disabled', () => {
    const result = conn.toggleCalendar('cal-1');
    expect(result.isOk()).toBe(true);
    const updated = result.getValue();
    const cal1 = updated.selectedCalendars.find((c) => c.id === 'cal-1');
    expect(cal1?.enabled).toBe(false);
  });

  it('toggles a disabled calendar to enabled', () => {
    const result = conn.toggleCalendar('cal-2');
    expect(result.isOk()).toBe(true);
    const cal2 = result.getValue().selectedCalendars.find((c) => c.id === 'cal-2');
    expect(cal2?.enabled).toBe(true);
  });

  it('fails when calendar ID does not exist', () => {
    const result = conn.toggleCalendar('nonexistent');
    expect(result.isFail()).toBe(true);
    expect(result.getError().message).toContain('nonexistent');
  });

  it('does not mutate other calendars when toggling', () => {
    const result = conn.toggleCalendar('cal-1');
    const cal2 = result.getValue().selectedCalendars.find((c) => c.id === 'cal-2');
    expect(cal2?.enabled).toBe(false); // unchanged
  });
});

describe('CalendarConnection — enabledCalendars', () => {
  it('returns only enabled calendars', () => {
    const base = CalendarConnection.create(validProps).getValue();
    const calendars = [
      { id: 'cal-1', name: 'Personal', color: '#ff0000', enabled: true },
      { id: 'cal-2', name: 'Work', color: '#0000ff', enabled: false },
      { id: 'cal-3', name: 'Family', color: '#00ff00', enabled: true },
    ];
    const conn = base.updateSelectedCalendars(calendars).getValue();
    expect(conn.enabledCalendars).toHaveLength(2);
    expect(conn.enabledCalendars.map((c) => c.id)).toEqual(['cal-1', 'cal-3']);
  });
});

describe('CalendarConnection — deactivate() / activate()', () => {
  it('deactivates a connection', () => {
    const conn = CalendarConnection.create(validProps).getValue();
    const deactivated = conn.deactivate();
    expect(deactivated.isActive).toBe(false);
  });

  it('clears webhook data on deactivate', () => {
    const baseProps: CalendarConnectionProps = {
      id: 'conn-001',
      userId: 'user-123',
      provider: 'google',
      isActive: true,
      selectedCalendars: [],
      webhookChannelId: 'ch-123',
      webhookResourceId: 'res-456',
      webhookExpiresAt: new Date(Date.now() + 100000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const conn = CalendarConnection.reconstitute(baseProps);
    const deactivated = conn.deactivate();
    expect(deactivated.webhookChannelId).toBeUndefined();
    expect(deactivated.webhookResourceId).toBeUndefined();
    expect(deactivated.webhookExpiresAt).toBeUndefined();
  });

  it('activates a deactivated connection', () => {
    const conn = CalendarConnection.create(validProps).getValue().deactivate();
    const activated = conn.activate();
    expect(activated.isActive).toBe(true);
  });
});

describe('CalendarConnection — webhook computed properties', () => {
  it('isWebhookExpiringSoon returns true when webhook expires in <24h', () => {
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    const conn = CalendarConnection.reconstitute({
      id: 'conn-001',
      userId: 'user-123',
      provider: 'google',
      isActive: true,
      selectedCalendars: [],
      webhookExpiresAt: expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(conn.isWebhookExpiringSoon).toBe(true);
  });

  it('isWebhookExpired returns true for past expiry', () => {
    const expiresAt = new Date(Date.now() - 1000);
    const conn = CalendarConnection.reconstitute({
      id: 'conn-001',
      userId: 'user-123',
      provider: 'google',
      isActive: true,
      selectedCalendars: [],
      webhookExpiresAt: expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(conn.isWebhookExpired).toBe(true);
  });
});

describe('CalendarConnection — recordSync()', () => {
  it('updates lastSyncedAt to current time', () => {
    const conn = CalendarConnection.create(validProps).getValue();
    expect(conn.lastSyncedAt).toBeUndefined();
    const before = new Date();
    const synced = conn.recordSync();
    const after = new Date();
    expect(synced.lastSyncedAt).toBeDefined();
    expect(synced.lastSyncedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(synced.lastSyncedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});

describe('CalendarConnection — equals()', () => {
  it('returns true for same ID', () => {
    const a = CalendarConnection.create(validProps).getValue();
    const b = CalendarConnection.create(validProps).getValue();
    expect(a.equals(b)).toBe(true);
  });

  it('returns false for different IDs', () => {
    const a = CalendarConnection.create(validProps).getValue();
    const b = CalendarConnection.create({ ...validProps, id: 'conn-002' }).getValue();
    expect(a.equals(b)).toBe(false);
  });
});

describe('CalendarConnection — toJSON()', () => {
  it('returns a plain object with all props', () => {
    const conn = CalendarConnection.create(validProps).getValue();
    const json = conn.toJSON();
    expect(json.id).toBe('conn-001');
    expect(json.provider).toBe('google');
    expect(Array.isArray(json.selectedCalendars)).toBe(true);
  });
});
