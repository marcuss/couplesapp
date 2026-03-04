/**
 * CalendarEvent Entity
 * Represents an event imported from an external calendar provider (Google/Apple).
 * This is a read-model — external events are displayed but not directly edited.
 */

import { Result } from '../../shared/utils/Result';
import { ValidationError } from '../errors/DomainError';
import { CalendarProvider } from './CalendarConnection';

export interface CalendarEventProps {
  id: string;
  connectionId: string;
  userId: string;
  externalId: string;           // Google event ID or Apple UID
  calendarId: string;           // Which calendar within the provider
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  isAllDay: boolean;
  location?: string;
  color?: string;               // Color from external provider
  provider: CalendarProvider;
  couplePlanEventId?: string;   // Link to CouplePlan event if exported from there
  etag?: string;                // For change detection
  syncedAt: Date;
}

export interface CreateCalendarEventProps {
  id: string;
  connectionId: string;
  userId: string;
  externalId: string;
  calendarId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  isAllDay?: boolean;
  location?: string;
  color?: string;
  provider: CalendarProvider;
  couplePlanEventId?: string;
  etag?: string;
}

export class CalendarEvent {
  private constructor(private readonly props: CalendarEventProps) {}

  /**
   * Create a new CalendarEvent with validation
   */
  static create(
    props: CreateCalendarEventProps
  ): Result<CalendarEvent, ValidationError> {
    if (!props.id || props.id.trim().length === 0) {
      return Result.fail(new ValidationError('Event ID is required', 'id'));
    }

    if (!props.connectionId || props.connectionId.trim().length === 0) {
      return Result.fail(new ValidationError('Connection ID is required', 'connectionId'));
    }

    if (!props.userId || props.userId.trim().length === 0) {
      return Result.fail(new ValidationError('User ID is required', 'userId'));
    }

    if (!props.externalId || props.externalId.trim().length === 0) {
      return Result.fail(new ValidationError('External event ID is required', 'externalId'));
    }

    if (!props.calendarId || props.calendarId.trim().length === 0) {
      return Result.fail(new ValidationError('Calendar ID is required', 'calendarId'));
    }

    if (!props.title || props.title.trim().length === 0) {
      return Result.fail(new ValidationError('Title is required', 'title'));
    }

    if (props.title.trim().length > 500) {
      return Result.fail(
        new ValidationError('Title must be at most 500 characters', 'title')
      );
    }

    if (!props.startTime) {
      return Result.fail(new ValidationError('Start time is required', 'startTime'));
    }

    if (!['google', 'apple'].includes(props.provider)) {
      return Result.fail(
        new ValidationError('Provider must be "google" or "apple"', 'provider')
      );
    }

    if (props.endTime && props.endTime < props.startTime) {
      return Result.fail(
        new ValidationError('End time must be after start time', 'endTime')
      );
    }

    return Result.ok(
      new CalendarEvent({
        id: props.id,
        connectionId: props.connectionId,
        userId: props.userId,
        externalId: props.externalId,
        calendarId: props.calendarId,
        title: props.title.trim(),
        description: props.description?.trim(),
        startTime: props.startTime,
        endTime: props.endTime,
        isAllDay: props.isAllDay ?? false,
        location: props.location?.trim(),
        color: props.color,
        provider: props.provider,
        couplePlanEventId: props.couplePlanEventId,
        etag: props.etag,
        syncedAt: new Date(),
      })
    );
  }

  /**
   * Reconstitute from persistence (no validation)
   */
  static reconstitute(props: CalendarEventProps): CalendarEvent {
    return new CalendarEvent(props);
  }

  // ─── Getters ──────────────────────────────────────────────────────────────

  get id(): string { return this.props.id; }
  get connectionId(): string { return this.props.connectionId; }
  get userId(): string { return this.props.userId; }
  get externalId(): string { return this.props.externalId; }
  get calendarId(): string { return this.props.calendarId; }
  get title(): string { return this.props.title; }
  get description(): string | undefined { return this.props.description; }
  get startTime(): Date { return this.props.startTime; }
  get endTime(): Date | undefined { return this.props.endTime; }
  get isAllDay(): boolean { return this.props.isAllDay; }
  get location(): string | undefined { return this.props.location; }
  get color(): string | undefined { return this.props.color; }
  get provider(): CalendarProvider { return this.props.provider; }
  get couplePlanEventId(): string | undefined { return this.props.couplePlanEventId; }
  get etag(): string | undefined { return this.props.etag; }
  get syncedAt(): Date { return this.props.syncedAt; }

  // ─── Computed properties ──────────────────────────────────────────────────

  /** The display color for the event (provider color or fallback) */
  get displayColor(): string {
    if (this.props.color) return this.props.color;
    // Provider default colors
    return this.props.provider === 'google' ? '#4285F4' : '#1C1C1E';
  }

  get isUpcoming(): boolean {
    return this.props.startTime > new Date();
  }

  get isPast(): boolean {
    const end = this.props.endTime ?? this.props.startTime;
    return end < new Date();
  }

  get isOngoing(): boolean {
    const now = new Date();
    return (
      this.props.startTime <= now &&
      (!this.props.endTime || this.props.endTime >= now)
    );
  }

  /** Returns true if this external event was originally created from CouplePlan */
  get isExportedFromCouplePlan(): boolean {
    return !!this.props.couplePlanEventId;
  }

  // ─── Domain methods ───────────────────────────────────────────────────────

  /**
   * Check if this event has changed compared to stored etag
   */
  hasChangedSince(storedEtag: string): boolean {
    return this.props.etag !== storedEtag;
  }

  /**
   * Update with fresh data from external provider
   */
  refresh(updates: {
    title?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
    isAllDay?: boolean;
    location?: string;
    color?: string;
    etag?: string;
  }): CalendarEvent {
    return new CalendarEvent({
      ...this.props,
      title: updates.title?.trim() ?? this.props.title,
      description: updates.description?.trim() ?? this.props.description,
      startTime: updates.startTime ?? this.props.startTime,
      endTime: updates.endTime ?? this.props.endTime,
      isAllDay: updates.isAllDay ?? this.props.isAllDay,
      location: updates.location?.trim() ?? this.props.location,
      color: updates.color ?? this.props.color,
      etag: updates.etag ?? this.props.etag,
      syncedAt: new Date(),
    });
  }

  /**
   * Convert to plain object for persistence
   */
  toJSON(): CalendarEventProps {
    return { ...this.props };
  }

  /**
   * Check equality by ID
   */
  equals(other: CalendarEvent): boolean {
    return this.props.id === other.props.id;
  }
}
