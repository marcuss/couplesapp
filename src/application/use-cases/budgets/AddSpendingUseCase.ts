/**
 * Add Spending Use Case
 * Handles adding spending to a budget
 */

import { Result, AsyncResult } from '../../../shared/utils/Result';
import { DomainError, UnauthorizedError, NotFoundError, ValidationError } from '../../../domain/errors/DomainError';
import { IBudgetRepository } from '../../../domain/repositories/IBudgetRepository';
import { AddSpendingDTO, AddSpendingResult } from '../../dto/AddSpendingDTO';

export class AddSpendingUseCase {
  constructor(
    private readonly budgetRepository: IBudgetRepository
  ) {}

  async execute(dto: AddSpendingDTO): AsyncResult<AddSpendingResult, DomainError> {
    // Validate input
    const validationError = this.validateInput(dto);
    if (validationError) {
      return Result.fail(validationError);
    }

    // Find the budget
    const budgetResult = await this.budgetRepository.findById(dto.budgetId);
    if (budgetResult.isFail()) {
      return Result.fail(budgetResult.getError());
    }

    const budget = budgetResult.getValue();
    if (!budget) {
      return Result.fail(new NotFoundError('Budget', dto.budgetId));
    }

    // Verify user can modify this budget
    if (!budget.canBeModifiedBy(dto.userId)) {
      return Result.fail(
        new UnauthorizedError('You do not have permission to update this budget')
      );
    }

    // Add spending
    const addResult = budget.addSpending(dto.amount);
    if (addResult.isFail()) {
      return Result.fail(addResult.getError());
    }

    const updatedBudget = addResult.getValue();

    // Save the updated budget
    const saveResult = await this.budgetRepository.update(updatedBudget);
    if (saveResult.isFail()) {
      return Result.fail(saveResult.getError());
    }

    return Result.ok({
      budgetId: updatedBudget.id,
      addedAmount: dto.amount,
      newSpent: updatedBudget.spent,
      remaining: updatedBudget.remaining,
      utilizationPercentage: updatedBudget.utilizationPercentage,
      isOverBudget: updatedBudget.isOverBudget,
      isNearLimit: updatedBudget.isNearLimit,
    });
  }

  private validateInput(dto: AddSpendingDTO): ValidationError | null {
    if (!dto.budgetId || dto.budgetId.trim().length === 0) {
      return new ValidationError('Budget ID is required', 'budgetId');
    }

    if (!dto.userId || dto.userId.trim().length === 0) {
      return new ValidationError('User ID is required', 'userId');
    }

    if (dto.amount === undefined || dto.amount === null) {
      return new ValidationError('Amount is required', 'amount');
    }

    if (typeof dto.amount !== 'number' || isNaN(dto.amount)) {
      return new ValidationError('Amount must be a valid number', 'amount');
    }

    if (dto.amount <= 0) {
      return new ValidationError('Amount must be greater than zero', 'amount');
    }

    return null;
  }
}
