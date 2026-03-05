/**
 * CalendarConnection Entity
 * Represents a user's connection to an external calendar provider (Google, Apple).
 * Follows Clean Architecture — pure domain logic, no framework dependencies.
 */

import { Result } from '../../shared/utils/Result';
import { ValidationError } from '../errors/DomainError';

export type CalendarProvider = 'google' | 'apple';

export interface CalendarInfo {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
}

export interface CalendarConnectionProps {
  id: string;
  userId: string;
  provider: CalendarProvider;
  providerAccountEmail?: string;
  isActive: boolean;
  selectedCalendars: CalendarInfo[];
  webhookChannelId?: string;
  webhookResourceId?: string;
  webhookExpiresAt?: Date;
  lastSyncedAt?: Date;
  tokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCalendarConnectionProps {
  id: string;
  userId: string;
  provider: CalendarProvider;
  providerAccountEmail?: string;
}

export class CalendarConnection {
  private constructor(private readonly props: CalendarConnectionProps) {}

  /**
   * Create a new CalendarConnection with validation
   */
  static create(
    props: CreateCalendarConnectionProps
  ): Result<CalendarConnection, ValidationError> {
    if (!props.id || props.id.trim().length === 0) {
      return Result.fail(new ValidationError('Connection ID is required', 'id'));
    }

    if (!props.userId || props.userId.trim().length === 0) {
      return Result.fail(new ValidationError('User ID is required', 'userId'));
    }

    if (!props.provider) {
      return Result.fail(new ValidationError('Provider is required', 'provider'));
    }

    if (!['google', 'apple'].includes(props.provider)) {
      return Result.fail(
        new ValidationError('Provider must be "google" or "apple"', 'provider')
      );
    }

    if (
      props.providerAccountEmail !== undefined &&
      props.providerAccountEmail.trim().length > 0
    ) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(props.providerAccountEmail.trim())) {
        return Result.fail(
          new ValidationError('Provider account email is invalid', 'providerAccountEmail')
        );
      }
    }

    const now = new Date();
    const connection = new CalendarConnection({
      id: props.id,
      userId: props.userId,
      provider: props.provider,
      providerAccountEmail: props.providerAccountEmail?.trim(),
      isActive: true,
      selectedCalendars: [],
      createdAt: now,
      updatedAt: now,
    });

    return Result.ok(connection);
  }

  /**
   * Reconstitute a CalendarConnection from persistence (no validation)
   */
  static reconstitute(props: CalendarConnectionProps): CalendarConnection {
    return new CalendarConnection(props);
  }

  // ─── Getters ──────────────────────────────────────────────────────────────

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get provider(): CalendarProvider {
    return this.props.provider;
  }

  get providerAccountEmail(): string | undefined {
    return this.props.providerAccountEmail;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get selectedCalendars(): CalendarInfo[] {
    return [...this.props.selectedCalendars];
  }

  get enabledCalendars(): CalendarInfo[] {
    return this.props.selectedCalendars.filter((c) => c.enabled);
  }

  get webhookChannelId(): string | undefined {
    return this.props.webhookChannelId;
  }

  get webhookResourceId(): string | undefined {
    return this.props.webhookResourceId;
  }

  get webhookExpiresAt(): Date | undefined {
    return this.props.webhookExpiresAt;
  }

  get lastSyncedAt(): Date | undefined {
    return this.props.lastSyncedAt;
  }

  get tokenExpiresAt(): Date | undefined {
    return this.props.tokenExpiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // ─── Computed properties ──────────────────────────────────────────────────

  /** Returns true if the webhook needs to be renewed (expires in <24h) */
  get isWebhookExpiringSoon(): boolean {
    if (!this.props.webhookExpiresAt) return false;
    const threshold = 24 * 60 * 60 * 1000; // 24 hours
    return this.props.webhookExpiresAt.getTime() - Date.now() < threshold;
  }

  /** Returns true if the webhook has expired */
  get isWebhookExpired(): boolean {
    if (!this.props.webhookExpiresAt) return false;
    return this.props.webhookExpiresAt < new Date();
  }

  /** Returns true if the access token has expired */
  get isTokenExpired(): boolean {
    if (!this.props.tokenExpiresAt) return false;
    return this.props.tokenExpiresAt < new Date();
  }

  // ─── Domain methods ───────────────────────────────────────────────────────

  /**
   * Update the set of available calendars and their enabled state
   */
  updateSelectedCalendars(
    calendars: CalendarInfo[]
  ): Result<CalendarConnection, ValidationError> {
    if (!Array.isArray(calendars)) {
      return Result.fail(new ValidationError('Calendars must be an array', 'selectedCalendars'));
    }

    return Result.ok(
      new CalendarConnection({
        ...this.props,
        selectedCalendars: calendars,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Toggle a specific calendar's enabled state
   */
  toggleCalendar(calendarId: string): Result<CalendarConnection, ValidationError> {
    const calendar = this.props.selectedCalendars.find((c) => c.id === calendarId);
    if (!calendar) {
      return Result.fail(
        new ValidationError(`Calendar ${calendarId} not found`, 'calendarId')
      );
    }

    const updated = this.props.selectedCalendars.map((c) =>
      c.id === calendarId ? { ...c, enabled: !c.enabled } : c
    );

    return Result.ok(
      new CalendarConnection({
        ...this.props,
        selectedCalendars: updated,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Mark the connection as disconnected (soft disable)
   */
  deactivate(): CalendarConnection {
    return new CalendarConnection({
      ...this.props,
      isActive: false,
      webhookChannelId: undefined,
      webhookResourceId: undefined,
      webhookExpiresAt: undefined,
      updatedAt: new Date(),
    });
  }

  /**
   * Reactivate a previously deactivated connection
   */
  activate(): CalendarConnection {
    return new CalendarConnection({
      ...this.props,
      isActive: true,
      updatedAt: new Date(),
    });
  }

  /**
   * Record a successful sync
   */
  recordSync(): CalendarConnection {
    return new CalendarConnection({
      ...this.props,
      lastSyncedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Update webhook registration info
   */
  updateWebhook(
    channelId: string,
    resourceId: string,
    expiresAt: Date
  ): CalendarConnection {
    return new CalendarConnection({
      ...this.props,
      webhookChannelId: channelId,
      webhookResourceId: resourceId,
      webhookExpiresAt: expiresAt,
      updatedAt: new Date(),
    });
  }

  /**
   * Update token expiry
   */
  updateTokenExpiry(expiresAt: Date): CalendarConnection {
    return new CalendarConnection({
      ...this.props,
      tokenExpiresAt: expiresAt,
      updatedAt: new Date(),
    });
  }

  /**
   * Convert to plain object for persistence
   */
  toJSON(): CalendarConnectionProps {
    return { ...this.props };
  }

  /**
   * Check equality by ID
   */
  equals(other: CalendarConnection): boolean {
    return this.props.id === other.props.id;
  }
}
