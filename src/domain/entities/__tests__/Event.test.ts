/**
 * Event Entity Tests - TDD
 */
import { describe, it, expect } from 'vitest';
import { Event, EventProps, CreateEventProps } from '../Event';

const baseDate = () => new Date('2030-06-15T10:00:00Z');
const endDate = () => new Date('2030-06-15T12:00:00Z');

const validProps = (): CreateEventProps => ({
  id: 'event-1',
  title: 'Dinner date',
  startDate: baseDate(),
  createdBy: 'user-1',
  partnerId: 'user-2',
});

// ─── create() ────────────────────────────────────────────────────────────────
describe('Event.create()', () => {
  it('creates event with minimum props', () => {
    const result = Event.create(validProps());
    expect(result.isOk()).toBe(true);
    const event = result.getValue();
    expect(event.id).toBe('event-1');
    expect(event.title).toBe('Dinner date');
    expect(event.type).toBe('other');
    expect(event.isAllDay).toBe(false);
  });

  it('defaults type to other', () => {
    const event = Event.create(validProps()).getValue();
    expect(event.type).toBe('other');
  });

  it('defaults isAllDay to false', () => {
    const event = Event.create(validProps()).getValue();
    expect(event.isAllDay).toBe(false);
  });

  it('accepts all event types', () => {
    const types = ['date', 'anniversary', 'appointment', 'trip', 'other'] as const;
    for (const type of types) {
      const result = Event.create({ ...validProps(), id: `e-${type}`, type });
      expect(result.isOk()).toBe(true);
      expect(result.getValue().type).toBe(type);
    }
  });

  it('accepts an endDate after startDate', () => {
    const result = Event.create({ ...validProps(), endDate: endDate() });
    expect(result.isOk()).toBe(true);
    expect(result.getValue().endDate).toEqual(endDate());
  });

  it('rejects endDate before startDate', () => {
    const before = new Date('2030-06-14T09:00:00Z');
    const result = Event.create({ ...validProps(), endDate: before });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('endDate');
  });

  it('rejects endDate equal to startDate', () => {
    const result = Event.create({ ...validProps(), endDate: baseDate() });
    expect(result.isFail()).toBe(true);
  });

  it('rejects event duration > 30 days', () => {
    const longEnd = new Date('2030-06-15T10:00:00Z');
    longEnd.setDate(longEnd.getDate() + 31);
    const result = Event.create({ ...validProps(), endDate: longEnd });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('endDate');
  });

  it('fails when id is empty', () => {
    const result = Event.create({ ...validProps(), id: '' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('id');
  });

  it('fails when title is too short (< 2 chars)', () => {
    const result = Event.create({ ...validProps(), title: 'A' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('title');
  });

  it('fails when title is too long (> 100 chars)', () => {
    const result = Event.create({ ...validProps(), title: 'T'.repeat(101) });
    expect(result.isFail()).toBe(true);
  });

  it('fails when createdBy is empty', () => {
    const result = Event.create({ ...validProps(), createdBy: '' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('createdBy');
  });

  it('fails when partnerId is empty', () => {
    const result = Event.create({ ...validProps(), partnerId: '' });
    expect(result.isFail()).toBe(true);
    expect(result.getError().field).toBe('partnerId');
  });

  it('trims description and location', () => {
    const event = Event.create({
      ...validProps(),
      description: '  nice place  ',
      location: '  Paris  ',
    }).getValue();
    expect(event.description).toBe('nice place');
    expect(event.location).toBe('Paris');
  });
});

// ─── reconstitute() ──────────────────────────────────────────────────────────
describe('Event.reconstitute()', () => {
  it('reconstitutes with all fields intact', () => {
    const now = new Date('2025-01-01');
    const props: EventProps = {
      id: 'e-99', title: 'Anniversary', startDate: now, endDate: new Date('2025-01-02'),
      type: 'anniversary', isAllDay: true, createdBy: 'u1', partnerId: 'u2',
      createdAt: now, updatedAt: now,
    };
    const event = Event.reconstitute(props);
    expect(event.type).toBe('anniversary');
    expect(event.isAllDay).toBe(true);
  });
});

// ─── Temporal helpers ────────────────────────────────────────────────────────
describe('Event temporal helpers', () => {
  it('isUpcoming for future event', () => {
    const event = Event.create(validProps()).getValue(); // 2030
    expect(event.isUpcoming).toBe(true);
    expect(event.isPast).toBe(false);
  });

  it('isPast for past event', () => {
    const props: EventProps = {
      id: 'e-old', title: 'Old date', startDate: new Date('2020-01-01'),
      type: 'date', isAllDay: false, createdBy: 'u1', partnerId: 'u2',
      createdAt: new Date(), updatedAt: new Date(),
    };
    const event = Event.reconstitute(props);
    expect(event.isPast).toBe(true);
    expect(event.isUpcoming).toBe(false);
  });

  it('duration in hours', () => {
    const event = Event.create({ ...validProps(), endDate: endDate() }).getValue();
    expect(event.durationInHours).toBe(2);
  });
});

// ─── overlapsWith ────────────────────────────────────────────────────────────
describe('Event.overlapsWith()', () => {
  const makeEvent = (id: string, start: string, end: string) => Event.reconstitute({
    id, title: 'Event', startDate: new Date(start), endDate: new Date(end),
    type: 'other', isAllDay: false, createdBy: 'u1', partnerId: 'u2',
    createdAt: new Date(), updatedAt: new Date(),
  });

  it('detects overlap', () => {
    const a = makeEvent('a', '2030-06-15T10:00:00Z', '2030-06-15T12:00:00Z');
    const b = makeEvent('b', '2030-06-15T11:00:00Z', '2030-06-15T13:00:00Z');
    expect(a.overlapsWith(b)).toBe(true);
  });

  it('no overlap for sequential events', () => {
    const a = makeEvent('a', '2030-06-15T10:00:00Z', '2030-06-15T11:00:00Z');
    const b = makeEvent('b', '2030-06-15T11:00:00Z', '2030-06-15T12:00:00Z');
    expect(a.overlapsWith(b)).toBe(false);
  });
});

// ─── update / reschedule ─────────────────────────────────────────────────────
describe('Event.update() and reschedule()', () => {
  it('updates title', () => {
    const event = Event.create(validProps()).getValue();
    const updated = event.update({ title: 'New title' }).getValue();
    expect(updated.title).toBe('New title');
  });

  it('reschedules to new dates', () => {
    const event = Event.create(validProps()).getValue();
    const newStart = new Date('2031-01-01T09:00:00Z');
    const newEnd = new Date('2031-01-01T11:00:00Z');
    const rescheduled = event.reschedule(newStart, newEnd).getValue();
    expect(rescheduled.startDate).toEqual(newStart);
    expect(rescheduled.endDate).toEqual(newEnd);
  });
});
