/**
 * Delete Budget Use Case
 * Handles deleting a budget
 */

import { Result, AsyncResult } from '../../../shared/utils/Result';
import { DomainError, UnauthorizedError, NotFoundError, ValidationError } from '../../../domain/errors/DomainError';
import { IBudgetRepository } from '../../../domain/repositories/IBudgetRepository';
import { DeleteBudgetDTO, DeleteBudgetResult } from '../../dto/DeleteBudgetDTO';

export class DeleteBudgetUseCase {
  constructor(
    private readonly budgetRepository: IBudgetRepository
  ) {}

  async execute(dto: DeleteBudgetDTO): AsyncResult<DeleteBudgetResult, DomainError> {
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

    // Verify user can delete this budget
    if (!budget.canBeModifiedBy(dto.userId)) {
      return Result.fail(
        new UnauthorizedError('You do not have permission to delete this budget')
      );
    }

    // Delete the budget
    const deleteResult = await this.budgetRepository.delete(dto.id);
    if (deleteResult.isFail()) {
      return Result.fail(deleteResult.getError());
    }

    return Result.ok({
      success: true,
      deletedAt: new Date(),
    });
  }

  private validateInput(dto: DeleteBudgetDTO): ValidationError | null {
    if (!dto.id || dto.id.trim().length === 0) {
      return new ValidationError('Budget ID is required', 'id');
    }

    if (!dto.userId || dto.userId.trim().length === 0) {
      return new ValidationError('User ID is required', 'userId');
    }

    return null;
  }
}
