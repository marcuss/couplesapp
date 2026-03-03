/**
 * Delete Goal Use Case
 * Handles deleting a couple goal
 */

import { Result, AsyncResult } from '../../../shared/utils/Result';
import {
  DomainError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../../domain/errors/DomainError';
import { IGoalRepository } from '../../../domain/repositories/IGoalRepository';

export interface DeleteGoalDTO {
  goalId: string;
  userId: string;
}

export interface DeleteGoalResult {
  success: boolean;
  deletedAt: Date;
}

export class DeleteGoalUseCase {
  constructor(private readonly goalRepository: IGoalRepository) {}

  async execute(dto: DeleteGoalDTO): AsyncResult<DeleteGoalResult, DomainError> {
    // Validate input
    const validationError = this.validateInput(dto);
    if (validationError) {
      return Result.fail(validationError);
    }

    // Find the goal
    const goalResult = await this.goalRepository.findById(dto.goalId);
    if (goalResult.isFail()) {
      return Result.fail(goalResult.getError());
    }

    const goal = goalResult.getValue();
    if (!goal) {
      return Result.fail(new NotFoundError('Goal not found', 'Goal', dto.goalId));
    }

    // Check if user can delete this goal
    if (!goal.canBeModifiedBy(dto.userId)) {
      return Result.fail(
        new UnauthorizedError('You do not have permission to delete this goal')
      );
    }

    // Delete the goal
    const deleteResult = await this.goalRepository.delete(dto.goalId);
    if (deleteResult.isFail()) {
      return Result.fail(deleteResult.getError());
    }

    return Result.ok({
      success: true,
      deletedAt: new Date(),
    });
  }

  private validateInput(dto: DeleteGoalDTO): ValidationError | null {
    if (!dto.goalId || dto.goalId.trim().length === 0) {
      return new ValidationError('Goal ID is required', 'goalId');
    }

    if (!dto.userId || dto.userId.trim().length === 0) {
      return new ValidationError('User ID is required', 'userId');
    }

    return null;
  }
}
