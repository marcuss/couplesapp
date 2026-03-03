/**
 * ITaskService - Application Service Interface for Tasks
 * Presentation layer interacts with this interface, NOT with Supabase directly.
 */

import { Task } from '../../types';

export interface CreateTaskData {
  title: string;
  description?: string;
  due_date?: string;
  userId: string;
}

export interface ITaskService {
  /**
   * Get all tasks for a couple (user + optional partner)
   */
  getAll(userId: string, partnerId?: string): Promise<Task[]>;

  /**
   * Create a new task
   */
  create(data: CreateTaskData): Promise<void>;

  /**
   * Toggle task completion status
   */
  toggleComplete(taskId: string, currentCompleted: boolean): Promise<void>;

  /**
   * Delete a task
   */
  delete(taskId: string): Promise<void>;
}
