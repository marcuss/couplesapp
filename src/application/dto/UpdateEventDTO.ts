/**
 * Update Event DTO
 * Data Transfer Object for updating an existing event
 */

import { EventType } from '../../domain/entities/Event';

export interface UpdateEventDTO {
  id: string;
  userId: string;
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  type?: EventType;
  isAllDay?: boolean;
}

export interface UpdateEventResult {
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
