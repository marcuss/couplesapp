/**
 * Create Task DTO
 * Data Transfer Object for creating a new task
 */

import { TaskPriority } from '../../domain/entities/Task';

export interface CreateTaskDTO {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  assignedTo?: string;
  goalId?: string;
  createdBy: string;
  partnerId: string;
}

export interface CreateTaskResult {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: TaskPriority;
  dueDate?: Date;
  assignedTo?: string;
  goalId?: string;
  isOverdue: boolean;
  isDueSoon: boolean;
}
