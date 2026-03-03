/**
 * IEventService - Application Service Interface for Events
 * Presentation layer interacts with this interface, NOT with Supabase directly.
 */

import { CalendarEvent } from '../../types';

export interface CreateEventData {
  title: string;
  description?: string;
  date: string;
  time?: string;
  userId: string;
}

export interface IEventService {
  /**
   * Get all events for a couple (user + optional partner)
   */
  getAll(userId: string, partnerId?: string): Promise<CalendarEvent[]>;

  /**
   * Create a new event
   */
  create(data: CreateEventData): Promise<void>;

  /**
   * Update an event
   */
  update(eventId: string, data: Partial<CreateEventData>): Promise<void>;

  /**
   * Delete an event
   */
  delete(eventId: string): Promise<void>;
}
