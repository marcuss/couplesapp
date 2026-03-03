/**
 * Create Task Use Case
 * Handles creating a new task for a couple
 */

import { Result, AsyncResult } from '../../../shared/utils/Result';
import { DomainError, UnauthorizedError, ValidationError } from '../../../domain/errors/DomainError';
import { Task } from '../../../domain/entities/Task';
import { ITaskRepository } from '../../../domain/repositories/ITaskRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { CreateTaskDTO, CreateTaskResult } from '../../dto/CreateTaskDTO';

export interface IIdGenerator {
  generate(): string;
}

export class CreateTaskUseCase {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly userRepository: IUserRepository,
    private readonly idGenerator: IIdGenerator
  ) {}

  async execute(dto: CreateTaskDTO): AsyncResult<CreateTaskResult, DomainError> {
    // Validate input
    const validationError = this.validateInput(dto);
    if (validationError) {
      return Result.fail(validationError);
    }

    // Verify creator exists and has a partner
    const creatorResult = await this.userRepository.findById(dto.createdBy);
    if (creatorResult.isFail()) {
      return Result.fail(creatorResult.getError());
    }

    const creator = creatorResult.getValue();
    if (!creator) {
      return Result.fail(new UnauthorizedError('Creator not found'));
    }

    if (!creator.hasPartner) {
      return Result.fail(
        new UnauthorizedError('You need a partner to create tasks')
      );
    }

    // Verify the partnerId matches
    if (creator.partnerId !== dto.partnerId) {
      return Result.fail(new UnauthorizedError('Invalid partner'));
    }

    // Validate assignedTo if provided
    if (dto.assignedTo) {
      if (dto.assignedTo !== dto.createdBy && dto.assignedTo !== dto.partnerId) {
        return Result.fail(
          new ValidationError('Can only assign to creator or partner', 'assignedTo')
        );
      }
    }

    // Create the task entity
    const taskResult = Task.create({
      id: this.idGenerator.generate(),
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      dueDate: dto.dueDate,
      assignedTo: dto.assignedTo,
      goalId: dto.goalId,
      createdBy: dto.createdBy,
      partnerId: dto.partnerId,
    });

    if (taskResult.isFail()) {
      return Result.fail(taskResult.getError());
    }

    const task = taskResult.getValue();

    // Save the task
    const saveResult = await this.taskRepository.save(task);
    if (saveResult.isFail()) {
      return Result.fail(saveResult.getError());
    }

    return Result.ok({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      assignedTo: task.assignedTo,
      goalId: task.goalId,
      isOverdue: task.isOverdue,
      isDueSoon: task.isDueSoon,
    });
  }

  private validateInput(dto: CreateTaskDTO): ValidationError | null {
    if (!dto.title || dto.title.trim().length === 0) {
      return new ValidationError('Title is required', 'title');
    }

    if (dto.title.trim().length < 2) {
      return new ValidationError('Title must be at least 2 characters', 'title');
    }

    if (dto.title.trim().length > 100) {
      return new ValidationError('Title must be at most 100 characters', 'title');
    }

    if (!dto.createdBy || dto.createdBy.trim().length === 0) {
      return new ValidationError('Creator ID is required', 'createdBy');
    }

    if (!dto.partnerId || dto.partnerId.trim().length === 0) {
      return new ValidationError('Partner ID is required', 'partnerId');
    }

    if (dto.dueDate) {
      if (!(dto.dueDate instanceof Date) || isNaN(dto.dueDate.getTime())) {
        return new ValidationError('Due date must be a valid date', 'dueDate');
      }
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const due = new Date(dto.dueDate);
      due.setHours(0, 0, 0, 0);
      if (due < now) {
        return new ValidationError('Due date cannot be in the past', 'dueDate');
      }
    }

    return null;
  }
}
