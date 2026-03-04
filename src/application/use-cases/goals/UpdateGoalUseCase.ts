/**
 * Update Goal Use Case
 * Handles updating an existing couple goal
 */

import { Result, AsyncResult } from '../../../shared/utils/Result';
import {
  DomainError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../../domain/errors/DomainError';
import { IGoalRepository } from '../../../domain/repositories/IGoalRepository';
import { UpdateGoalDTO, UpdateGoalResult } from '../../dto/UpdateGoalDTO';

export class UpdateGoalUseCase {
  constructor(private readonly goalRepository: IGoalRepository) {}

  async execute(dto: UpdateGoalDTO): AsyncResult<UpdateGoalResult, DomainError> {
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

    // Check if user can modify this goal
    if (!goal.canBeModifiedBy(dto.userId)) {
      return Result.fail(
        new UnauthorizedError('You do not have permission to update this goal')
      );
    }

    // Apply updates based on status change or field updates
    let updatedGoal = goal;

    if (dto.status && dto.status !== goal.status) {
      // Handle status transitions
      switch (dto.status) {
        case 'in_progress': {
          const startResult = goal.start();
          if (startResult.isFail()) {
            return Result.fail(startResult.getError());
          }
          updatedGoal = startResult.getValue();
          break;
        }
        case 'completed': {
          const completeResult = goal.complete();
          if (completeResult.isFail()) {
            return Result.fail(completeResult.getError());
          }
          updatedGoal = completeResult.getValue();
          break;
        }
        case 'cancelled': {
          const cancelResult = goal.cancel();
          if (cancelResult.isFail()) {
            return Result.fail(cancelResult.getError());
          }
          updatedGoal = cancelResult.getValue();
          break;
        }
        default:
          return Result.fail(new ValidationError('Invalid status transition', 'status'));
      }
    }

    // Apply field updates
    if (dto.title !== undefined || dto.description !== undefined || 
        dto.targetDate !== undefined || dto.priority !== undefined) {
      const updateResult = updatedGoal.update({
        title: dto.title,
        description: dto.description,
        targetDate: dto.targetDate,
        priority: dto.priority,
      });

      if (updateResult.isFail()) {
        return Result.fail(updateResult.getError());
      }

      updatedGoal = updateResult.getValue();
    }

    // Save the updated goal
    const saveResult = await this.goalRepository.update(updatedGoal);
    if (saveResult.isFail()) {
      return Result.fail(saveResult.getError());
    }

    return Result.ok({
      id: updatedGoal.id,
      title: updatedGoal.title,
      description: updatedGoal.description,
      targetDate: updatedGoal.targetDate,
      status: updatedGoal.status,
      priority: updatedGoal.priority,
      updatedAt: updatedGoal.updatedAt,
    });
  }

  private validateInput(dto: UpdateGoalDTO): ValidationError | null {
    if (!dto.goalId || dto.goalId.trim().length === 0) {
      return new ValidationError('Goal ID is required', 'goalId');
    }

    if (!dto.userId || dto.userId.trim().length === 0) {
      return new ValidationError('User ID is required', 'userId');
    }

    if (dto.title !== undefined) {
      if (dto.title.trim().length < 3) {
        return new ValidationError('Title must be at least 3 characters', 'title');
      }
      if (dto.title.trim().length > 100) {
        return new ValidationError('Title must be at most 100 characters', 'title');
      }
    }

    if (dto.targetDate !== undefined) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const targetDate = new Date(dto.targetDate);
      targetDate.setHours(0, 0, 0, 0);

      if (targetDate < now) {
        return new ValidationError('Target date cannot be in the past', 'targetDate');
      }
    }

    if (dto.status !== undefined) {
      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(dto.status)) {
        return new ValidationError('Invalid status value', 'status');
      }
    }

    return null;
  }
}
