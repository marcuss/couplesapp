/**
 * Create Budget Use Case
 * Handles creating a new budget for a couple
 */

import { Result, AsyncResult } from '../../../shared/utils/Result';
import { DomainError, UnauthorizedError, ValidationError } from '../../../domain/errors/DomainError';
import { Budget } from '../../../domain/entities/Budget';
import { IBudgetRepository } from '../../../domain/repositories/IBudgetRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { CreateBudgetDTO, CreateBudgetResult } from '../../dto/CreateBudgetDTO';

export interface IIdGenerator {
  generate(): string;
}

export class CreateBudgetUseCase {
  constructor(
    private readonly budgetRepository: IBudgetRepository,
    private readonly userRepository: IUserRepository,
    private readonly idGenerator: IIdGenerator
  ) {}

  async execute(dto: CreateBudgetDTO): AsyncResult<CreateBudgetResult, DomainError> {
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
        new UnauthorizedError('You need a partner to create budgets')
      );
    }

    // Verify the partnerId matches
    if (creator.partnerId !== dto.partnerId) {
      return Result.fail(new UnauthorizedError('Invalid partner'));
    }

    // Create the budget entity
    const budgetResult = Budget.create({
      id: this.idGenerator.generate(),
      name: dto.name,
      amount: dto.amount,
      category: dto.category,
      notes: dto.notes,
      createdBy: dto.createdBy,
      partnerId: dto.partnerId,
    });

    if (budgetResult.isFail()) {
      return Result.fail(budgetResult.getError());
    }

    const budget = budgetResult.getValue();

    // Save the budget
    const saveResult = await this.budgetRepository.save(budget);
    if (saveResult.isFail()) {
      return Result.fail(saveResult.getError());
    }

    return Result.ok({
      id: budget.id,
      name: budget.name,
      amount: budget.amount,
      spent: budget.spent,
      remaining: budget.remaining,
      category: budget.category,
      notes: budget.notes,
      utilizationPercentage: budget.utilizationPercentage,
    });
  }

  private validateInput(dto: CreateBudgetDTO): ValidationError | null {
    if (!dto.name || dto.name.trim().length === 0) {
      return new ValidationError('Name is required', 'name');
    }

    if (dto.name.trim().length < 2) {
      return new ValidationError('Name must be at least 2 characters', 'name');
    }

    if (dto.name.trim().length > 50) {
      return new ValidationError('Name must be at most 50 characters', 'name');
    }

    if (dto.amount === undefined || dto.amount === null) {
      return new ValidationError('Amount is required', 'amount');
    }

    if (typeof dto.amount !== 'number' || isNaN(dto.amount)) {
      return new ValidationError('Amount must be a valid number', 'amount');
    }

    if (dto.amount <= 0) {
      return new ValidationError('Amount must be greater than zero', 'amount');
    }

    if (dto.amount > 999999999.99) {
      return new ValidationError('Amount is too large', 'amount');
    }

    if (!dto.category) {
      return new ValidationError('Category is required', 'category');
    }

    if (!dto.createdBy || dto.createdBy.trim().length === 0) {
      return new ValidationError('Creator ID is required', 'createdBy');
    }

    if (!dto.partnerId || dto.partnerId.trim().length === 0) {
      return new ValidationError('Partner ID is required', 'partnerId');
    }

    return null;
  }
}
