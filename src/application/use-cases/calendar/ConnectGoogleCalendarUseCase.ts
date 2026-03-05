/**
 * ConnectGoogleCalendarUseCase
 * Handles the OAuth callback after a user authorizes Google Calendar access.
 * The actual token exchange is done by the Supabase Edge Function (server-side).
 * This use case saves the connection and initial calendar list to the domain.
 */

import { Result, AsyncResult } from '../../../shared/utils/Result';
import { DomainError, ValidationError, ConflictError } from '../../../domain/errors/DomainError';
import { CalendarConnection, CalendarInfo } from '../../../domain/entities/CalendarConnection';
import { ICalendarConnectionRepository } from '../../../domain/repositories/ICalendarConnectionRepository';

export interface IIdGenerator {
  generate(): string;
}

export interface ConnectGoogleCalendarDTO {
  /** The authenticated user's ID */
  userId: string;
  /** The email of the connected Google account (display only) */
  providerAccountEmail: string;
  /** Initial list of calendars fetched from Google after token exchange */
  availableCalendars: CalendarInfo[];
  /** Token expiry (returned by Edge Function after exchange) */
  tokenExpiresAt?: Date;
}

export interface ConnectGoogleCalendarResult {
  connectionId: string;
  provider: 'google';
  providerAccountEmail: string;
  availableCalendars: CalendarInfo[];
}

export class ConnectGoogleCalendarUseCase {
  constructor(
    private readonly connectionRepository: ICalendarConnectionRepository,
    private readonly idGenerator: IIdGenerator
  ) {}

  async execute(
    dto: ConnectGoogleCalendarDTO
  ): AsyncResult<ConnectGoogleCalendarResult, DomainError> {
    // Validate inputs
    const validationError = this.validateInput(dto);
    if (validationError) {
      return Result.fail(validationError);
    }

    // Check if connection already exists for this user + Google
    const existsResult = await this.connectionRepository.existsForUserAndProvider(
      dto.userId,
      'google'
    );
    if (existsResult.isFail()) {
      return Result.fail(existsResult.getError());
    }
    if (existsResult.getValue()) {
      return Result.fail(
        new ConflictError(
          'Google Calendar is already connected for this user. Disconnect first before reconnecting.'
        )
      );
    }

    // Create the domain entity
    const connectionResult = CalendarConnection.create({
      id: this.idGenerator.generate(),
      userId: dto.userId,
      provider: 'google',
      providerAccountEmail: dto.providerAccountEmail,
    });

    if (connectionResult.isFail()) {
      return Result.fail(connectionResult.getError());
    }

    let connection = connectionResult.getValue();

    // Set available calendars (all enabled by default)
    const calendarsWithDefaults: CalendarInfo[] = dto.availableCalendars.map((cal) => ({
      ...cal,
      enabled: cal.enabled !== false, // default to enabled
    }));

    const withCalendarsResult = connection.updateSelectedCalendars(calendarsWithDefaults);
    if (withCalendarsResult.isFail()) {
      return Result.fail(withCalendarsResult.getError());
    }
    connection = withCalendarsResult.getValue();

    // Update token expiry if provided
    if (dto.tokenExpiresAt) {
      connection = connection.updateTokenExpiry(dto.tokenExpiresAt);
    }

    // Persist
    const saveResult = await this.connectionRepository.save(connection);
    if (saveResult.isFail()) {
      return Result.fail(saveResult.getError());
    }

    return Result.ok({
      connectionId: connection.id,
      provider: 'google',
      providerAccountEmail: connection.providerAccountEmail ?? dto.providerAccountEmail,
      availableCalendars: connection.selectedCalendars,
    });
  }

  private validateInput(dto: ConnectGoogleCalendarDTO): ValidationError | null {
    if (!dto.userId || dto.userId.trim().length === 0) {
      return new ValidationError('User ID is required', 'userId');
    }

    if (!dto.providerAccountEmail || dto.providerAccountEmail.trim().length === 0) {
      return new ValidationError('Provider account email is required', 'providerAccountEmail');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dto.providerAccountEmail.trim())) {
      return new ValidationError('Provider account email is invalid', 'providerAccountEmail');
    }

    if (!Array.isArray(dto.availableCalendars)) {
      return new ValidationError('Available calendars must be an array', 'availableCalendars');
    }

    return null;
  }
}
