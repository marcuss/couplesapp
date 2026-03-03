/**
 * Assign Task DTO
 * Data Transfer Object for assigning a task to a user
 */

export interface AssignTaskDTO {
  taskId: string;
  assignedTo: string;
  assignedBy: string;
}

export interface AssignTaskResult {
  taskId: string;
  assignedTo: string;
  assignedAt: Date;
}
