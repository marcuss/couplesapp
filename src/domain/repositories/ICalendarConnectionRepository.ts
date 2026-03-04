/**
 * ICalendarConnectionRepository (Port)
 * Defines the contract for persisting and retrieving CalendarConnection entities.
 */

import { AsyncResult } from '../../shared/utils/Result';
import { DomainError, NotFoundError } from '../errors/DomainError';
import { CalendarConnection, CalendarProvider } from '../entities/CalendarConnection';

export interface ICalendarConnectionRepository {
  /**
   * Find a connection by its unique ID
   */
  findById(id: string): AsyncResult<CalendarConnection | null, DomainError>;

  /**
   * Find a connection by user ID and provider
   */
  findByUserAndProvider(
    userId: string,
    provider: CalendarProvider
  ): AsyncResult<CalendarConnection | null, DomainError>;

  /**
   * Find all active connections for a user
   */
  findActiveByUser(userId: string): AsyncResult<CalendarConnection[], DomainError>;

  /**
   * Find all connections for a user (including inactive)
   */
  findAllByUser(userId: string): AsyncResult<CalendarConnection[], DomainError>;

  /**
   * Find connections with webhooks expiring before a given date
   * (Used for webhook renewal jobs)
   */
  findWithExpiringWebhooks(
    before: Date
  ): AsyncResult<CalendarConnection[], DomainError>;

  /**
   * Save a new connection
   */
  save(connection: CalendarConnection): AsyncResult<void, DomainError>;

  /**
   * Update an existing connection
   */
  update(connection: CalendarConnection): AsyncResult<void, NotFoundError | DomainError>;

  /**
   * Delete a connection by ID (and cascade delete its cached events)
   */
  delete(id: string): AsyncResult<void, NotFoundError | DomainError>;

  /**
   * Check if a user already has a connection with a given provider
   */
  existsForUserAndProvider(
    userId: string,
    provider: CalendarProvider
  ): AsyncResult<boolean, DomainError>;
}
