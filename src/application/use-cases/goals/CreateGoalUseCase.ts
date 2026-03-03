/**
 * Create Goal Use Case
 * Handles creating a new couple goal
 */

import { Result, AsyncResult } from '../../../shared/utils/Result';
import { DomainError, UnauthorizedError, ValidationError } from '../../../domain/errors/DomainError';
import { Goal } from '../../../domain/entities/Goal';
import { IGoalRepository } from '../../../domain/repositories/IGoalRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { CreateGoalDTO, CreateGoalResult } from '../../dto/CreateGoalDTO';

export interface IIdGenerator {
  generate(): string;
}

export class CreateGoalUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly userRepository: IUserRepository,
    private readonly idGenerator: IIdGenerator
  ) {}

  async execute(dto: CreateGoalDTO): AsyncResult<CreateGoalResult, DomainError> {
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
        new UnauthorizedError('You need a partner to create goals')
      );
    }

    // Verify the partnerId matches
    if (creator.partnerId !== dto.partnerId) {
      return Result.fail(new UnauthorizedError('Invalid partner'));
    }

    // Create the goal entity
    const goalResult = Goal.create({
      id: this.idGenerator.generate(),
      title: dto.title,
      description: dto.description,
      targetDate: dto.targetDate,
      priority: dto.priority,
      createdBy: dto.createdBy,
      partnerId: dto.partnerId,
    });

    if (goalResult.isFail()) {
      return Result.fail(goalResult.getError());
    }

    const goal = goalResult.getValue();

    // Save the goal
    const saveResult = await this.goalRepository.save(goal);
    if (saveResult.isFail()) {
      return Result.fail(saveResult.getError());
    }

    return Result.ok({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      targetDate: goal.targetDate,
      status: goal.status,
      priority: goal.priority,
    });
  }

  private validateInput(dto: CreateGoalDTO): ValidationError | null {
    if (!dto.title || dto.title.trim().length === 0) {
      return new ValidationError('Title is required', 'title');
    }

    if (dto.title.trim().length < 3) {
      return new ValidationError('Title must be at least 3 characters', 'title');
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

    if (dto.targetDate) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const targetDate = new Date(dto.targetDate);
      targetDate.setHours(0, 0, 0, 0);

      if (targetDate < now) {
        return new ValidationError('Target date cannot be in the past', 'targetDate');
      }
    }

    return null;
  }
}
