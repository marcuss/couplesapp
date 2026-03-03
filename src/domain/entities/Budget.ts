/**
 * Budget Entity
 * Represents a budget item for a couple in the CouplePlan application
 */

import { Result } from '../../shared/utils/Result';
import { ValidationError } from '../errors/DomainError';

export type BudgetCategory = 
  | 'housing'
  | 'food'
  | 'transportation'
  | 'entertainment'
  | 'savings'
  | 'utilities'
  | 'healthcare'
  | 'shopping'
  | 'travel'
  | 'other';

export interface BudgetProps {
  id: string;
  name: string;
  amount: number;
  spent: number;
  category: BudgetCategory;
  notes?: string;
  createdBy: string;
  partnerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBudgetProps {
  id: string;
  name: string;
  amount: number;
  category: BudgetCategory;
  notes?: string;
  createdBy: string;
  partnerId: string;
}

export class Budget {
  private constructor(private readonly props: BudgetProps) {}

  /**
   * Create a new Budget with validation
   */
  static create(props: CreateBudgetProps): Result<Budget, ValidationError> {
    // Validate ID
    if (!props.id || props.id.trim().length === 0) {
      return Result.fail(new ValidationError('Budget ID is required', 'id'));
    }

    // Validate name
    const nameValidation = this.validateName(props.name);
    if (nameValidation.isFail()) {
      return Result.fail(nameValidation.getError());
    }

    // Validate amount
    const amountValidation = this.validateAmount(props.amount);
    if (amountValidation.isFail()) {
      return Result.fail(amountValidation.getError());
    }

    // Validate category
    if (!props.category) {
      return Result.fail(new ValidationError('Category is required', 'category'));
    }

    // Validate createdBy
    if (!props.createdBy || props.createdBy.trim().length === 0) {
      return Result.fail(new ValidationError('Creator ID is required', 'createdBy'));
    }

    // Validate partnerId
    if (!props.partnerId || props.partnerId.trim().length === 0) {
      return Result.fail(new ValidationError('Partner ID is required', 'partnerId'));
    }

    const now = new Date();
    const budget = new Budget({
      ...props,
      spent: 0,
      notes: props.notes?.trim(),
      createdAt: now,
      updatedAt: now,
    });

    return Result.ok(budget);
  }

  /**
   * Reconstitute a Budget from persistence (no validation)
   */
  static reconstitute(props: BudgetProps): Budget {
    return new Budget(props);
  }

  /**
   * Validate name
   */
  private static validateName(name: string): Result<void, ValidationError> {
    if (!name || name.trim().length === 0) {
      return Result.fail(new ValidationError('Name is required', 'name'));
    }

    if (name.trim().length < 2) {
      return Result.fail(new ValidationError('Name must be at least 2 characters', 'name'));
    }

    if (name.trim().length > 50) {
      return Result.fail(new ValidationError('Name must be at most 50 characters', 'name'));
    }

    return Result.ok(undefined);
  }

  /**
   * Validate amount
   */
  private static validateAmount(amount: number): Result<void, ValidationError> {
    if (amount === undefined || amount === null) {
      return Result.fail(new ValidationError('Amount is required', 'amount'));
    }

    if (typeof amount !== 'number' || isNaN(amount)) {
      return Result.fail(new ValidationError('Amount must be a valid number', 'amount'));
    }

    if (amount <= 0) {
      return Result.fail(new ValidationError('Amount must be greater than zero', 'amount'));
    }

    if (amount > 999999999.99) {
      return Result.fail(new ValidationError('Amount is too large', 'amount'));
    }

    // Check decimal places (max 2)
    const decimalPlaces = (amount.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      return Result.fail(new ValidationError('Amount can have at most 2 decimal places', 'amount'));
    }

    return Result.ok(undefined);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get amount(): number {
    return this.props.amount;
  }

  get spent(): number {
    return this.props.spent;
  }

  get remaining(): number {
    return this.props.amount - this.props.spent;
  }

  get category(): BudgetCategory {
    return this.props.category;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get partnerId(): string {
    return this.props.partnerId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get utilizationPercentage(): number {
    if (this.props.amount === 0) return 0;
    return Math.round((this.props.spent / this.props.amount) * 100);
  }

  get isOverBudget(): boolean {
    return this.props.spent > this.props.amount;
  }

  get isNearLimit(): boolean {
    return this.utilizationPercentage >= 80 && !this.isOverBudget;
  }

  // Domain methods

  /**
   * Update budget details
   */
  update(updates: {
    name?: string;
    amount?: number;
    category?: BudgetCategory;
    notes?: string;
  }): Result<Budget, ValidationError> {
    if (updates.name !== undefined) {
      const nameValidation = Budget.validateName(updates.name);
      if (nameValidation.isFail()) {
        return Result.fail(nameValidation.getError());
      }
    }

    if (updates.amount !== undefined) {
      const amountValidation = Budget.validateAmount(updates.amount);
      if (amountValidation.isFail()) {
        return Result.fail(amountValidation.getError());
      }

      // Check if new amount is less than spent
      if (updates.amount < this.props.spent) {
        return Result.fail(
          new ValidationError('New amount cannot be less than already spent', 'amount')
        );
      }
    }

    const updatedBudget = new Budget({
      ...this.props,
      name: updates.name ?? this.props.name,
      amount: updates.amount ?? this.props.amount,
      category: updates.category ?? this.props.category,
      notes: updates.notes ?? this.props.notes,
      updatedAt: new Date(),
    });

    return Result.ok(updatedBudget);
  }

  /**
   * Add spending to the budget
   */
  addSpending(amount: number): Result<Budget, ValidationError> {
    if (amount <= 0) {
      return Result.fail(new ValidationError('Spending amount must be positive', 'amount'));
    }

    const newSpent = this.props.spent + amount;
    
    const updatedBudget = new Budget({
      ...this.props,
      spent: newSpent,
      updatedAt: new Date(),
    });

    return Result.ok(updatedBudget);
  }

  /**
   * Remove spending from the budget
   */
  removeSpending(amount: number): Result<Budget, ValidationError> {
    if (amount <= 0) {
      return Result.fail(new ValidationError('Amount to remove must be positive', 'amount'));
    }

    if (amount > this.props.spent) {
      return Result.fail(new ValidationError('Cannot remove more than spent', 'amount'));
    }

    const updatedBudget = new Budget({
      ...this.props,
      spent: this.props.spent - amount,
      updatedAt: new Date(),
    });

    return Result.ok(updatedBudget);
  }

  /**
   * Reset spending to zero
   */
  resetSpending(): Result<Budget, ValidationError> {
    const updatedBudget = new Budget({
      ...this.props,
      spent: 0,
      updatedAt: new Date(),
    });

    return Result.ok(updatedBudget);
  }

  /**
   * Check if user can modify this budget
   */
  canBeModifiedBy(userId: string): boolean {
    return this.props.createdBy === userId || this.props.partnerId === userId;
  }

  /**
   * Convert to plain object for persistence
   */
  toJSON(): BudgetProps {
    return { ...this.props };
  }

  /**
   * Check equality
   */
  equals(other: Budget): boolean {
    return this.props.id === other.props.id;
  }
}
