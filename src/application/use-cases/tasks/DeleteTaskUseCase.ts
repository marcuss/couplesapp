/**
 * Delete Task Use Case
 * Handles deleting a task
 */

import { Result, AsyncResult } from '../../../shared/utils/Result';
import { DomainError, UnauthorizedError, NotFoundError, ValidationError } from '../../../domain/errors/DomainError';
import { ITaskRepository } from '../../../domain/repositories/ITaskRepository';
import { DeleteTaskDTO, DeleteTaskResult } from '../../dto/DeleteTaskDTO';

export class DeleteTaskUseCase {
  constructor(
    private readonly taskRepository: ITaskRepository
  ) {}

  async execute(dto: DeleteTaskDTO): AsyncResult<DeleteTaskResult, DomainError> {
    // Validate input
    const validationError = this.validateInput(dto);
    if (validationError) {
      return Result.fail(validationError);
    }

    // Find the task
    const taskResult = await this.taskRepository.findById(dto.id);
    if (taskResult.isFail()) {
      return Result.fail(taskResult.getError());
    }

    const task = taskResult.getValue();
    if (!task) {
      return Result.fail(new NotFoundError('Task', dto.id));
    }

    // Verify user can delete this task
    if (!task.canBeModifiedBy(dto.userId)) {
      return Result.fail(
        new UnauthorizedError('You do not have permission to delete this task')
      );
    }

    // Delete the task
    const deleteResult = await this.taskRepository.delete(dto.id);
    if (deleteResult.isFail()) {
      return Result.fail(deleteResult.getError());
    }

    return Result.ok({
      success: true,
      deletedAt: new Date(),
    });
  }

  private validateInput(dto: DeleteTaskDTO): ValidationError | null {
    if (!dto.id || dto.id.trim().length === 0) {
      return new ValidationError('Task ID is required', 'id');
    }

    if (!dto.userId || dto.userId.trim().length === 0) {
      return new ValidationError('User ID is required', 'userId');
    }

    return null;
  }
}
