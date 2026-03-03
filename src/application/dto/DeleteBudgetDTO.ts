/**
 * Delete Budget DTO
 * Data Transfer Object for deleting a budget
 */

export interface DeleteBudgetDTO {
  id: string;
  userId: string;
}

export interface DeleteBudgetResult {
  success: boolean;
  deletedAt: Date;
}
