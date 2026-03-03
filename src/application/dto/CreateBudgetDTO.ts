/**
 * Create Budget DTO
 * Data Transfer Object for creating a new budget
 */

import { BudgetCategory } from '../../domain/entities/Budget';

export interface CreateBudgetDTO {
  name: string;
  amount: number;
  category: BudgetCategory;
  notes?: string;
  createdBy: string;
  partnerId: string;
}

export interface CreateBudgetResult {
  id: string;
  name: string;
  amount: number;
  spent: number;
  remaining: number;
  category: BudgetCategory;
  notes?: string;
  utilizationPercentage: number;
}
