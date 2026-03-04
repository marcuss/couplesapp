/**
 * ICalendarEventRepository (Port)
 * Defines the contract for persisting and retrieving CalendarEvent entities (external cache).
 */

import { AsyncResult } from '../../shared/utils/Result';
import { DomainError, NotFoundError } from '../errors/DomainError';
import { CalendarEvent } from '../entities/CalendarEvent';
import { CalendarProvider } from '../entities/CalendarConnection';

export interface ICalendarEventRepository {
  /**
   * Find a cached event by its internal ID
   */
  findById(id: string): AsyncResult<CalendarEvent | null, DomainError>;

  /**
   * Find a cached event by its external provider ID and connection
   */
  findByExternalId(
    connectionId: string,
    externalId: string
  ): AsyncResult<CalendarEvent | null, DomainError>;

  /**
   * Find all cached events for a user within a time range
   */
  findByUserAndDateRange(
    userId: string,
    startTime: Date,
    endTime: Date
  ): AsyncResult<CalendarEvent[], DomainError>;

  /**
   * Find all cached events for a specific connection
   */
  findByConnection(connectionId: string): AsyncResult<CalendarEvent[], DomainError>;

  /**
   * Find events by provider for a user
   */
  findByUserAndProvider(
    userId: string,
    provider: CalendarProvider
  ): AsyncResult<CalendarEvent[], DomainError>;

  /**
   * Find all cached events for a user and their partner (unified view)
   */
  findForCouple(
    userId: string,
    partnerId: string,
    startTime?: Date,
    endTime?: Date
  ): AsyncResult<CalendarEvent[], DomainError>;

  /**
   * Save a new cached event (upsert by externalId + connectionId)
   */
  save(event: CalendarEvent): AsyncResult<void, DomainError>;

  /**
   * Save multiple cached events in bulk (upsert)
   */
  saveMany(events: CalendarEvent[]): AsyncResult<void, DomainError>;

  /**
   * Update an existing cached event
   */
  update(event: CalendarEvent): AsyncResult<void, NotFoundError | DomainError>;

  /**
   * Delete a cached event by its internal ID
   */
  delete(id: string): AsyncResult<void, NotFoundError | DomainError>;

  /**
   * Delete all cached events for a connection (used when disconnecting)
   */
  deleteByConnection(connectionId: string): AsyncResult<void, DomainError>;

  /**
   * Delete all cached events for a user (used when account is deleted)
   */
  deleteByUser(userId: string): AsyncResult<void, DomainError>;

  /**
   * Count cached events for a connection (for diagnostics)
   */
  countByConnection(connectionId: string): AsyncResult<number, DomainError>;
}
