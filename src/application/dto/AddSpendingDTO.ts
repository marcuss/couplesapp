/**
 * Add Spending DTO
 * Data Transfer Object for adding spending to a budget
 */

export interface AddSpendingDTO {
  budgetId: string;
  userId: string;
  amount: number;
  description?: string;
}

export interface AddSpendingResult {
  budgetId: string;
  addedAmount: number;
  newSpent: number;
  remaining: number;
  utilizationPercentage: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
}
