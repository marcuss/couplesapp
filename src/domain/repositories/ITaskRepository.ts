/**
 * Task Repository Interface (Port)
 * Defines the contract for task persistence operations
 */

import { AsyncResult } from '../../shared/utils/Result';
import { DomainError, NotFoundError } from '../errors/DomainError';
import { Task, TaskStatus, TaskPriority } from '../entities/Task';

export interface ITaskRepository {
  /**
   * Find a task by its unique ID
   */
  findById(id: string): AsyncResult<Task | null, DomainError>;

  /**
   * Find all tasks for a couple
   */
  findByCouple(userId: string, partnerId: string): AsyncResult<Task[], DomainError>;

  /**
   * Find tasks by status for a couple
   */
  findByStatus(
    userId: string,
    partnerId: string,
    status: TaskStatus
  ): AsyncResult<Task[], DomainError>;

  /**
   * Find tasks by priority for a couple
   */
  findByPriority(
    userId: string,
    partnerId: string,
    priority: TaskPriority
  ): AsyncResult<Task[], DomainError>;

  /**
   * Find tasks assigned to a specific user
   */
  findByAssignee(userId: string): AsyncResult<Task[], DomainError>;

  /**
   * Find tasks created by a specific user
   */
  findByCreator(userId: string): AsyncResult<Task[], DomainError>;

  /**
   * Find tasks linked to a goal
   */
  findByGoalId(goalId: string): AsyncResult<Task[], DomainError>;

  /**
   * Find overdue tasks for a couple
   */
  findOverdue(userId: string, partnerId: string): AsyncResult<Task[], DomainError>;

  /**
   * Find tasks due soon (within next 3 days)
   */
  findDueSoon(userId: string, partnerId: string): AsyncResult<Task[], DomainError>;

  /**
   * Find unassigned tasks for a couple
   */
  findUnassigned(userId: string, partnerId: string): AsyncResult<Task[], DomainError>;

  /**
   * Save a new task
   */
  save(task: Task): AsyncResult<void, DomainError>;

  /**
   * Update an existing task
   */
  update(task: Task): AsyncResult<void, NotFoundError | DomainError>;

  /**
   * Delete a task by ID
   */
  delete(id: string): AsyncResult<void, NotFoundError | DomainError>;

  /**
   * Count tasks by status for a couple
   */
  countByStatus(
    userId: string,
    partnerId: string,
    status: TaskStatus
  ): AsyncResult<number, DomainError>;

  /**
   * Count tasks assigned to a user
   */
  countByAssignee(userId: string): AsyncResult<number, DomainError>;
}
