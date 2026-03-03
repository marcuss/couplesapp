/**
 * Delete Task DTO
 * Data Transfer Object for deleting a task
 */

export interface DeleteTaskDTO {
  id: string;
  userId: string;
}

export interface DeleteTaskResult {
  success: boolean;
  deletedAt: Date;
}
