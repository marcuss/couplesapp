/**
 * IBudgetService - Application Service Interface for Budgets
 * Presentation layer interacts with this interface, NOT with Supabase directly.
 */

import { Budget } from '../../types';

export interface CreateBudgetData {
  category: string;
  amount: number;
  spent: number;
  userId: string;
}

export interface IBudgetService {
  /**
   * Get all budgets for a couple (user + optional partner)
   */
  getAll(userId: string, partnerId?: string): Promise<Budget[]>;

  /**
   * Create a new budget
   */
  create(data: CreateBudgetData): Promise<void>;

  /**
   * Update the spent amount of a budget
   */
  updateSpent(budgetId: string, newSpent: number): Promise<void>;

  /**
   * Delete a budget
   */
  delete(budgetId: string): Promise<void>;
}
