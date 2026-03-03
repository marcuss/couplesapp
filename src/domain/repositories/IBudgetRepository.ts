/**
 * Budget Repository Interface (Port)
 * Defines the contract for budget persistence operations
 */

import { AsyncResult } from '../../shared/utils/Result';
import { DomainError, NotFoundError } from '../errors/DomainError';
import { Budget, BudgetCategory } from '../entities/Budget';

export interface IBudgetRepository {
  /**
   * Find a budget by its unique ID
   */
  findById(id: string): AsyncResult<Budget | null, DomainError>;

  /**
   * Find all budgets for a couple
   */
  findByCouple(userId: string, partnerId: string): AsyncResult<Budget[], DomainError>;

  /**
   * Find budgets by category for a couple
   */
  findByCategory(
    userId: string,
    partnerId: string,
    category: BudgetCategory
  ): AsyncResult<Budget[], DomainError>;

  /**
   * Find budgets created by a specific user
   */
  findByCreator(userId: string): AsyncResult<Budget[], DomainError>;

  /**
   * Find over-budget items for a couple
   */
  findOverBudget(userId: string, partnerId: string): AsyncResult<Budget[], DomainError>;

  /**
   * Find budgets near their limit (>= 80% spent)
   */
  findNearLimit(userId: string, partnerId: string): AsyncResult<Budget[], DomainError>;

  /**
   * Save a new budget
   */
  save(budget: Budget): AsyncResult<void, DomainError>;

  /**
   * Update an existing budget
   */
  update(budget: Budget): AsyncResult<void, NotFoundError | DomainError>;

  /**
   * Delete a budget by ID
   */
  delete(id: string): AsyncResult<void, NotFoundError | DomainError>;

  /**
   * Get total budget amount for a couple
   */
  getTotalBudget(userId: string, partnerId: string): AsyncResult<number, DomainError>;

  /**
   * Get total spent amount for a couple
   */
  getTotalSpent(userId: string, partnerId: string): AsyncResult<number, DomainError>;

  /**
   * Get budget summary by category
   */
  getSummaryByCategory(
    userId: string,
    partnerId: string
  ): AsyncResult<Map<BudgetCategory, { amount: number; spent: number }>, DomainError>;
}
