/**
 * Update Task Use Case
 * Handles updating an existing task
 */

import { Result, AsyncResult } from '../../../shared/utils/Result';
import { DomainError, UnauthorizedError, NotFoundError, ValidationError } from '../../../domain/errors/DomainError';
import { ITaskRepository } from '../../../domain/repositories/ITaskRepository';
import { UpdateTaskDTO, UpdateTaskResult } from '../../dto/UpdateTaskDTO';

export class UpdateTaskUseCase {
  constructor(
    private readonly taskRepository: ITaskRepository
  ) {}

  async execute(dto: UpdateTaskDTO): AsyncResult<UpdateTaskResult, DomainError> {
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

    // Verify user can modify this task
    if (!task.canBeModifiedBy(dto.userId)) {
      return Result.fail(
        new UnauthorizedError('You do not have permission to update this task')
      );
    }

    // Apply updates
    const updateResult = task.update({
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      dueDate: dto.dueDate,
    });

    if (updateResult.isFail()) {
      return Result.fail(updateResult.getError());
    }

    const updatedTask = updateResult.getValue();

    // Save the updated task
    const saveResult = await this.taskRepository.update(updatedTask);
    if (saveResult.isFail()) {
      return Result.fail(saveResult.getError());
    }

    return Result.ok({
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description,
      status: updatedTask.status,
      priority: updatedTask.priority,
      dueDate: updatedTask.dueDate,
      assignedTo: updatedTask.assignedTo,
      isOverdue: updatedTask.isOverdue,
      isDueSoon: updatedTask.isDueSoon,
    });
  }

  private validateInput(dto: UpdateTaskDTO): ValidationError | null {
    if (!dto.id || dto.id.trim().length === 0) {
      return new ValidationError('Task ID is required', 'id');
    }

    if (!dto.userId || dto.userId.trim().length === 0) {
      return new ValidationError('User ID is required', 'userId');
    }

    if (dto.title !== undefined) {
      if (dto.title.trim().length === 0) {
        return new ValidationError('Title cannot be empty', 'title');
      }
      if (dto.title.trim().length < 2) {
        return new ValidationError('Title must be at least 2 characters', 'title');
      }
      if (dto.title.trim().length > 100) {
        return new ValidationError('Title must be at most 100 characters', 'title');
      }
    }

    if (dto.dueDate !== undefined) {
      if (!(dto.dueDate instanceof Date) || isNaN(dto.dueDate.getTime())) {
        return new ValidationError('Due date must be a valid date', 'dueDate');
      }
    }

    return null;
  }
}
