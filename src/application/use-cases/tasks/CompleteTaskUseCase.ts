/**
 * Complete Task Use Case
 * Handles completing a task
 */

import { Result, AsyncResult } from '../../../shared/utils/Result';
import { DomainError, UnauthorizedError, NotFoundError, ValidationError } from '../../../domain/errors/DomainError';
import { ITaskRepository } from '../../../domain/repositories/ITaskRepository';
import { CompleteTaskDTO, CompleteTaskResult } from '../../dto/CompleteTaskDTO';

export class CompleteTaskUseCase {
  constructor(
    private readonly taskRepository: ITaskRepository
  ) {}

  async execute(dto: CompleteTaskDTO): AsyncResult<CompleteTaskResult, DomainError> {
    // Validate input
    const validationError = this.validateInput(dto);
    if (validationError) {
      return Result.fail(validationError);
    }

    // Find the task
    const taskResult = await this.taskRepository.findById(dto.taskId);
    if (taskResult.isFail()) {
      return Result.fail(taskResult.getError());
    }

    const task = taskResult.getValue();
    if (!task) {
      return Result.fail(new NotFoundError('Task', dto.taskId));
    }

    // Verify user can modify this task
    if (!task.canBeModifiedBy(dto.userId)) {
      return Result.fail(
        new UnauthorizedError('You do not have permission to complete this task')
      );
    }

    // Complete the task
    const completeResult = task.complete();
    if (completeResult.isFail()) {
      return Result.fail(completeResult.getError());
    }

    const updatedTask = completeResult.getValue();

    // Save the updated task
    const saveResult = await this.taskRepository.update(updatedTask);
    if (saveResult.isFail()) {
      return Result.fail(saveResult.getError());
    }

    return Result.ok({
      taskId: updatedTask.id,
      status: updatedTask.status,
      completedAt: updatedTask.completedAt!,
    });
  }

  private validateInput(dto: CompleteTaskDTO): ValidationError | null {
    if (!dto.taskId || dto.taskId.trim().length === 0) {
      return new ValidationError('Task ID is required', 'taskId');
    }

    if (!dto.userId || dto.userId.trim().length === 0) {
      return new ValidationError('User ID is required', 'userId');
    }

    return null;
  }
}
