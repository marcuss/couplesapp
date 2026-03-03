/**
 * Update Budget Use Case
 * Handles updating an existing budget
 */

import { Result, AsyncResult } from '../../../shared/utils/Result';
import { DomainError, UnauthorizedError, NotFoundError, ValidationError } from '../../../domain/errors/DomainError';
import { IBudgetRepository } from '../../../domain/repositories/IBudgetRepository';
import { UpdateBudgetDTO, UpdateBudgetResult } from '../../dto/UpdateBudgetDTO';

export class UpdateBudgetUseCase {
  constructor(
    private readonly budgetRepository: IBudgetRepository
  ) {}

  async execute(dto: UpdateBudgetDTO): AsyncResult<UpdateBudgetResult, DomainError> {
    // Validate input
    const validationError = this.validateInput(dto);
    if (validationError) {
      return Result.fail(validationError);
    }

    // Find the budget
    const budgetResult = await this.budgetRepository.findById(dto.id);
    if (budgetResult.isFail()) {
      return Result.fail(budgetResult.getError());
    }

    const budget = budgetResult.getValue();
    if (!budget) {
      return Result.fail(new NotFoundError('Budget', dto.id));
    }

    // Verify user can modify this budget
    if (!budget.canBeModifiedBy(dto.userId)) {
      return Result.fail(
        new UnauthorizedError('You do not have permission to update this budget')
      );
    }

    // Apply updates
    const updateResult = budget.update({
      name: dto.name,
      amount: dto.amount,
      category: dto.category,
      notes: dto.notes,
    });

    if (updateResult.isFail()) {
      return Result.fail(updateResult.getError());
    }

    const updatedBudget = updateResult.getValue();

    // Save the updated budget
    const saveResult = await this.budgetRepository.update(updatedBudget);
    if (saveResult.isFail()) {
      return Result.fail(saveResult.getError());
    }

    return Result.ok({
      id: updatedBudget.id,
      name: updatedBudget.name,
      amount: updatedBudget.amount,
      spent: updatedBudget.spent,
      remaining: updatedBudget.remaining,
      category: updatedBudget.category,
      notes: updatedBudget.notes,
      utilizationPercentage: updatedBudget.utilizationPercentage,
    });
  }

  private validateInput(dto: UpdateBudgetDTO): ValidationError | null {
    if (!dto.id || dto.id.trim().length === 0) {
      return new ValidationError('Budget ID is required', 'id');
    }

    if (!dto.userId || dto.userId.trim().length === 0) {
      return new ValidationError('User ID is required', 'userId');
    }

    if (dto.name !== undefined) {
      if (dto.name.trim().length === 0) {
        return new ValidationError('Name cannot be empty', 'name');
      }
      if (dto.name.trim().length < 2) {
        return new ValidationError('Name must be at least 2 characters', 'name');
      }
      if (dto.name.trim().length > 50) {
        return new ValidationError('Name must be at most 50 characters', 'name');
      }
    }

    if (dto.amount !== undefined) {
      if (typeof dto.amount !== 'number' || isNaN(dto.amount)) {
        return new ValidationError('Amount must be a valid number', 'amount');
      }
      if (dto.amount <= 0) {
        return new ValidationError('Amount must be greater than zero', 'amount');
      }
      if (dto.amount > 999999999.99) {
        return new ValidationError('Amount is too large', 'amount');
      }
    }

    return null;
  }
}
