/**
 * Goal Repository Interface (Port)
 * Defines the contract for goal persistence operations
 */

import { AsyncResult } from '../../shared/utils/Result';
import { DomainError, NotFoundError } from '../errors/DomainError';
import { Goal, GoalStatus } from '../entities/Goal';

export interface IGoalRepository {
  /**
   * Find a goal by its unique ID
   */
  findById(id: string): AsyncResult<Goal | null, DomainError>;

  /**
   * Find all goals for a couple (by either partner ID)
   */
  findByCouple(userId: string, partnerId: string): AsyncResult<Goal[], DomainError>;

  /**
   * Find goals by status for a couple
   */
  findByStatus(
    userId: string,
    partnerId: string,
    status: GoalStatus
  ): AsyncResult<Goal[], DomainError>;

  /**
   * Find goals created by a specific user
   */
  findByCreator(userId: string): AsyncResult<Goal[], DomainError>;

  /**
   * Find overdue goals for a couple
   */
  findOverdue(userId: string, partnerId: string): AsyncResult<Goal[], DomainError>;

  /**
   * Find upcoming goals (with target date in the future)
   */
  findUpcoming(
    userId: string,
    partnerId: string,
    daysAhead?: number
  ): AsyncResult<Goal[], DomainError>;

  /**
   * Save a new goal
   */
  save(goal: Goal): AsyncResult<void, DomainError>;

  /**
   * Update an existing goal
   */
  update(goal: Goal): AsyncResult<void, NotFoundError | DomainError>;

  /**
   * Delete a goal by ID
   */
  delete(id: string): AsyncResult<void, NotFoundError | DomainError>;

  /**
   * Count goals by status for a couple
   */
  countByStatus(
    userId: string,
    partnerId: string,
    status: GoalStatus
  ): AsyncResult<number, DomainError>;
}
