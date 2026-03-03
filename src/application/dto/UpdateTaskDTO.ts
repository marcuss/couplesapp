/**
 * Update Task DTO
 * Data Transfer Object for updating an existing task
 */

import { TaskPriority } from '../../domain/entities/Task';

export interface UpdateTaskDTO {
  id: string;
  userId: string;
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
}

export interface UpdateTaskResult {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: TaskPriority;
  dueDate?: Date;
  assignedTo?: string;
  isOverdue: boolean;
  isDueSoon: boolean;
}
