/**
 * Create Event DTO
 * Data Transfer Object for creating a new event
 */

import { EventType } from '../../domain/entities/Event';

export interface CreateEventDTO {
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  type?: EventType;
  isAllDay?: boolean;
  createdBy: string;
  partnerId: string;
}

export interface CreateEventResult {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  type: EventType;
  isAllDay: boolean;
  durationInHours: number;
}
