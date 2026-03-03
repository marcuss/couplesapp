/**
 * Delete Event DTO
 * Data Transfer Object for deleting an event
 */

export interface DeleteEventDTO {
  id: string;
  userId: string;
}

export interface DeleteEventResult {
  success: boolean;
  deletedAt: Date;
}
