/**
 * Assign Task Use Case
 * Handles assigning a task to a user
 */

import { Result, AsyncResult } from '../../../shared/utils/Result';
import { DomainError, UnauthorizedError, NotFoundError, ValidationError } from '../../../domain/errors/DomainError';
import { ITaskRepository } from '../../../domain/repositories/ITaskRepository';
import { AssignTaskDTO, AssignTaskResult } from '../../dto/AssignTaskDTO';

export class AssignTaskUseCase {
  constructor(
    private readonly taskRepository: ITaskRepository
  ) {}

  async execute(dto: AssignTaskDTO): AsyncResult<AssignTaskResult, DomainError> {
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
    if (!task.canBeModifiedBy(dto.assignedBy)) {
      return Result.fail(
        new UnauthorizedError('You do not have permission to assign this task')
      );
    }

    // Verify assignedTo is either creator or partner
    if (dto.assignedTo !== task.createdBy && dto.assignedTo !== task.partnerId) {
      return Result.fail(
        new ValidationError('Can only assign to creator or partner', 'assignedTo')
      );
    }

    // Assign the task
    const assignResult = task.assignTo(dto.assignedTo);
    if (assignResult.isFail()) {
      return Result.fail(assignResult.getError());
    }

    const updatedTask = assignResult.getValue();

    // Save the updated task
    const saveResult = await this.taskRepository.update(updatedTask);
    if (saveResult.isFail()) {
      return Result.fail(saveResult.getError());
    }

    return Result.ok({
      taskId: updatedTask.id,
      assignedTo: updatedTask.assignedTo!,
      assignedAt: new Date(),
    });
  }

  private validateInput(dto: AssignTaskDTO): ValidationError | null {
    if (!dto.taskId || dto.taskId.trim().length === 0) {
      return new ValidationError('Task ID is required', 'taskId');
    }

    if (!dto.assignedTo || dto.assignedTo.trim().length === 0) {
      return new ValidationError('Assigned To is required', 'assignedTo');
    }

    if (!dto.assignedBy || dto.assignedBy.trim().length === 0) {
      return new ValidationError('Assigned By is required', 'assignedBy');
    }

    return null;
  }
}
