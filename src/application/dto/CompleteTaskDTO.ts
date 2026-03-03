/**
 * Complete Task DTO
 * Data Transfer Object for completing a task
 */

export interface CompleteTaskDTO {
  taskId: string;
  userId: string;
}

export interface CompleteTaskResult {
  taskId: string;
  status: 'completed';
  completedAt: Date;
}
