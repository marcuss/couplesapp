/**
 * Update Budget DTO
 * Data Transfer Object for updating an existing budget
 */

import { BudgetCategory } from '../../domain/entities/Budget';

export interface UpdateBudgetDTO {
  id: string;
  userId: string;
  name?: string;
  amount?: number;
  category?: BudgetCategory;
  notes?: string;
}

export interface UpdateBudgetResult {
  id: string;
  name: string;
  amount: number;
  spent: number;
  remaining: number;
  category: BudgetCategory;
  notes?: string;
  utilizationPercentage: number;
}
