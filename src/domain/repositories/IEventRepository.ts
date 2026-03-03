/**
 * Event Repository Interface (Port)
 * Defines the contract for event persistence operations
 */

import { AsyncResult } from '../../shared/utils/Result';
import { DomainError, NotFoundError } from '../errors/DomainError';
import { Event, EventType } from '../entities/Event';

export interface IEventRepository {
  /**
   * Find an event by its unique ID
   */
  findById(id: string): AsyncResult<Event | null, DomainError>;

  /**
   * Find all events for a couple
   */
  findByCouple(userId: string, partnerId: string): AsyncResult<Event[], DomainError>;

  /**
   * Find events by type for a couple
   */
  findByType(
    userId: string,
    partnerId: string,
    type: EventType
  ): AsyncResult<Event[], DomainError>;

  /**
   * Find events within a date range
   */
  findByDateRange(
    userId: string,
    partnerId: string,
    startDate: Date,
    endDate: Date
  ): AsyncResult<Event[], DomainError>;

  /**
   * Find upcoming events
   */
  findUpcoming(
    userId: string,
    partnerId: string,
    limit?: number
  ): AsyncResult<Event[], DomainError>;

  /**
   * Find ongoing events
   */
  findOngoing(userId: string, partnerId: string): AsyncResult<Event[], DomainError>;

  /**
   * Find past events
   */
  findPast(
    userId: string,
    partnerId: string,
    limit?: number
  ): AsyncResult<Event[], DomainError>;

  /**
   * Find events created by a specific user
   */
  findByCreator(userId: string): AsyncResult<Event[], DomainError>;

  /**
   * Save a new event
   */
  save(event: Event): AsyncResult<void, DomainError>;

  /**
   * Update an existing event
   */
  update(event: Event): AsyncResult<void, NotFoundError | DomainError>;

  /**
   * Delete an event by ID
   */
  delete(id: string): AsyncResult<void, NotFoundError | DomainError>;

  /**
   * Check if there are overlapping events
   */
  hasOverlappingEvents(
    userId: string,
    partnerId: string,
    startDate: Date,
    endDate: Date,
    excludeEventId?: string
  ): AsyncResult<boolean, DomainError>;

  /**
   * Find overlapping events
   */
  findOverlapping(
    userId: string,
    partnerId: string,
    startDate: Date,
    endDate: Date,
    excludeEventId?: string
  ): AsyncResult<Event[], DomainError>;
}
