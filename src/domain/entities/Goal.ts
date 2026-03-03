/**
 * Goal Entity
 * Represents a couple's goal in the CouplePlan application
 */

import { Result } from '../../shared/utils/Result';
import { ValidationError } from '../errors/DomainError';

export type GoalStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type GoalPriority = 'low' | 'medium' | 'high';

export interface GoalProps {
  id: string;
  title: string;
  description?: string;
  targetDate?: Date;
  status: GoalStatus;
  priority: GoalPriority;
  createdBy: string;
  partnerId: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGoalProps {
  id: string;
  title: string;
  description?: string;
  targetDate?: Date;
  priority?: GoalPriority;
  createdBy: string;
  partnerId: string;
}

export class Goal {
  private constructor(private readonly props: GoalProps) {}

  /**
   * Create a new Goal with validation
   */
  static create(props: CreateGoalProps): Result<Goal, ValidationError> {
    // Validate ID
    if (!props.id || props.id.trim().length === 0) {
      return Result.fail(new ValidationError('Goal ID is required', 'id'));
    }

    // Validate title
    const titleValidation = this.validateTitle(props.title);
    if (titleValidation.isFail()) {
      return Result.fail(titleValidation.getError());
    }

    // Validate createdBy
    if (!props.createdBy || props.createdBy.trim().length === 0) {
      return Result.fail(new ValidationError('Creator ID is required', 'createdBy'));
    }

    // Validate partnerId
    if (!props.partnerId || props.partnerId.trim().length === 0) {
      return Result.fail(new ValidationError('Partner ID is required', 'partnerId'));
    }

    // Validate target date if provided
    if (props.targetDate) {
      const dateValidation = this.validateTargetDate(props.targetDate);
      if (dateValidation.isFail()) {
        return Result.fail(dateValidation.getError());
      }
    }

    const now = new Date();
    const goal = new Goal({
      ...props,
      description: props.description?.trim(),
      status: 'pending',
      priority: props.priority ?? 'medium',
      createdAt: now,
      updatedAt: now,
    });

    return Result.ok(goal);
  }

  /**
   * Reconstitute a Goal from persistence (no validation)
   */
  static reconstitute(props: GoalProps): Goal {
    return new Goal(props);
  }

  /**
   * Validate title
   */
  private static validateTitle(title: string): Result<void, ValidationError> {
    if (!title || title.trim().length === 0) {
      return Result.fail(new ValidationError('Title is required', 'title'));
    }

    if (title.trim().length < 3) {
      return Result.fail(new ValidationError('Title must be at least 3 characters', 'title'));
    }

    if (title.trim().length > 100) {
      return Result.fail(new ValidationError('Title must be at most 100 characters', 'title'));
    }

    return Result.ok(undefined);
  }

  /**
   * Validate target date
   */
  private static validateTargetDate(date: Date): Result<void, ValidationError> {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Allow dates from today onwards (not in the past)
    if (targetDate < now) {
      return Result.fail(new ValidationError('Target date cannot be in the past', 'targetDate'));
    }

    // Don't allow dates more than 10 years in the future
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 10);
    if (targetDate > maxDate) {
      return Result.fail(new ValidationError('Target date is too far in the future', 'targetDate'));
    }

    return Result.ok(undefined);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get targetDate(): Date | undefined {
    return this.props.targetDate;
  }

  get status(): GoalStatus {
    return this.props.status;
  }

  get priority(): GoalPriority {
    return this.props.priority;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get partnerId(): string {
    return this.props.partnerId;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get isPending(): boolean {
    return this.props.status === 'pending';
  }

  get isInProgress(): boolean {
    return this.props.status === 'in_progress';
  }

  get isCompleted(): boolean {
    return this.props.status === 'completed';
  }

  get isCancelled(): boolean {
    return this.props.status === 'cancelled';
  }

  get isOverdue(): boolean {
    if (!this.props.targetDate || this.isCompleted || this.isCancelled) {
      return false;
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(this.props.targetDate);
    target.setHours(0, 0, 0, 0);
    return target < now;
  }

  // Domain methods

  /**
   * Update goal details
   */
  update(updates: {
    title?: string;
    description?: string;
    targetDate?: Date;
    priority?: GoalPriority;
  }): Result<Goal, ValidationError> {
    if (this.isCompleted || this.isCancelled) {
      return Result.fail(new ValidationError('Cannot update a completed or cancelled goal', 'status'));
    }

    if (updates.title !== undefined) {
      const titleValidation = Goal.validateTitle(updates.title);
      if (titleValidation.isFail()) {
        return Result.fail(titleValidation.getError());
      }
    }

    if (updates.targetDate !== undefined) {
      const dateValidation = Goal.validateTargetDate(updates.targetDate);
      if (dateValidation.isFail()) {
        return Result.fail(dateValidation.getError());
      }
    }

    const updatedGoal = new Goal({
      ...this.props,
      title: updates.title ?? this.props.title,
      description: updates.description ?? this.props.description,
      targetDate: updates.targetDate ?? this.props.targetDate,
      priority: updates.priority ?? this.props.priority,
      updatedAt: new Date(),
    });

    return Result.ok(updatedGoal);
  }

  /**
   * Start working on the goal
   */
  start(): Result<Goal, ValidationError> {
    if (!this.isPending) {
      return Result.fail(new ValidationError('Only pending goals can be started', 'status'));
    }

    return Result.ok(
      new Goal({
        ...this.props,
        status: 'in_progress',
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Complete the goal
   */
  complete(): Result<Goal, ValidationError> {
    if (this.isCompleted) {
      return Result.fail(new ValidationError('Goal is already completed', 'status'));
    }

    if (this.isCancelled) {
      return Result.fail(new ValidationError('Cannot complete a cancelled goal', 'status'));
    }

    return Result.ok(
      new Goal({
        ...this.props,
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Cancel the goal
   */
  cancel(): Result<Goal, ValidationError> {
    if (this.isCompleted) {
      return Result.fail(new ValidationError('Cannot cancel a completed goal', 'status'));
    }

    if (this.isCancelled) {
      return Result.fail(new ValidationError('Goal is already cancelled', 'status'));
    }

    return Result.ok(
      new Goal({
        ...this.props,
        status: 'cancelled',
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Reopen a cancelled goal
   */
  reopen(): Result<Goal, ValidationError> {
    if (!this.isCancelled) {
      return Result.fail(new ValidationError('Only cancelled goals can be reopened', 'status'));
    }

    return Result.ok(
      new Goal({
        ...this.props,
        status: 'pending',
        completedAt: undefined,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Change priority
   */
  setPriority(priority: GoalPriority): Result<Goal, ValidationError> {
    if (this.isCompleted || this.isCancelled) {
      return Result.fail(new ValidationError('Cannot change priority of completed or cancelled goal', 'status'));
    }

    return Result.ok(
      new Goal({
        ...this.props,
        priority,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Check if user can modify this goal
   */
  canBeModifiedBy(userId: string): boolean {
    return this.props.createdBy === userId || this.props.partnerId === userId;
  }

  /**
   * Convert to plain object for persistence
   */
  toJSON(): GoalProps {
    return { ...this.props };
  }

  /**
   * Check equality
   */
  equals(other: Goal): boolean {
    return this.props.id === other.props.id;
  }
}
