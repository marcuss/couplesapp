/**
 * Task Entity
 * Represents a task for a couple in the CouplePlan application
 */

import { Result } from '../../shared/utils/Result';
import { ValidationError } from '../errors/DomainError';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskProps {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  assignedTo?: string;
  goalId?: string;
  createdBy: string;
  partnerId: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskProps {
  id: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  assignedTo?: string;
  goalId?: string;
  createdBy: string;
  partnerId: string;
}

export class Task {
  private constructor(private readonly props: TaskProps) {}

  /**
   * Create a new Task with validation
   */
  static create(props: CreateTaskProps): Result<Task, ValidationError> {
    // Validate ID
    if (!props.id || props.id.trim().length === 0) {
      return Result.fail(new ValidationError('Task ID is required', 'id'));
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

    // Validate due date if provided
    if (props.dueDate) {
      const dueDateValidation = this.validateDueDate(props.dueDate);
      if (dueDateValidation.isFail()) {
        return Result.fail(dueDateValidation.getError());
      }
    }

    // Validate assignedTo if provided
    if (props.assignedTo) {
      const assignedToValidation = this.validateAssignedTo(
        props.assignedTo,
        props.createdBy,
        props.partnerId
      );
      if (assignedToValidation.isFail()) {
        return Result.fail(assignedToValidation.getError());
      }
    }

    const now = new Date();
    const task = new Task({
      ...props,
      description: props.description?.trim(),
      status: 'pending',
      priority: props.priority ?? 'medium',
      createdAt: now,
      updatedAt: now,
    });

    return Result.ok(task);
  }

  /**
   * Reconstitute a Task from persistence (no validation)
   */
  static reconstitute(props: TaskProps): Task {
    return new Task(props);
  }

  /**
   * Validate title
   */
  private static validateTitle(title: string): Result<void, ValidationError> {
    if (!title || title.trim().length === 0) {
      return Result.fail(new ValidationError('Title is required', 'title'));
    }

    if (title.trim().length < 2) {
      return Result.fail(new ValidationError('Title must be at least 2 characters', 'title'));
    }

    if (title.trim().length > 100) {
      return Result.fail(new ValidationError('Title must be at most 100 characters', 'title'));
    }

    return Result.ok(undefined);
  }

  /**
   * Validate due date
   */
  private static validateDueDate(date: Date): Result<void, ValidationError> {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);

    // Allow dates from today onwards
    if (dueDate < now) {
      return Result.fail(new ValidationError('Due date cannot be in the past', 'dueDate'));
    }

    // Don't allow dates more than 5 years in the future
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 5);
    if (dueDate > maxDate) {
      return Result.fail(new ValidationError('Due date is too far in the future', 'dueDate'));
    }

    return Result.ok(undefined);
  }

  /**
   * Validate assignedTo
   */
  private static validateAssignedTo(
    assignedTo: string,
    createdBy: string,
    partnerId: string
  ): Result<void, ValidationError> {
    if (assignedTo !== createdBy && assignedTo !== partnerId) {
      return Result.fail(
        new ValidationError('Can only assign to creator or partner', 'assignedTo')
      );
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

  get status(): TaskStatus {
    return this.props.status;
  }

  get priority(): TaskPriority {
    return this.props.priority;
  }

  get dueDate(): Date | undefined {
    return this.props.dueDate;
  }

  get assignedTo(): string | undefined {
    return this.props.assignedTo;
  }

  get goalId(): string | undefined {
    return this.props.goalId;
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

  get isAssigned(): boolean {
    return this.props.assignedTo !== undefined;
  }

  get isOverdue(): boolean {
    if (!this.props.dueDate || this.isCompleted) {
      return false;
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(this.props.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < now;
  }

  get isDueSoon(): boolean {
    if (!this.props.dueDate || this.isCompleted) {
      return false;
    }
    const now = new Date();
    const due = new Date(this.props.dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  }

  // Domain methods

  /**
   * Update task details
   */
  update(updates: {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: Date;
  }): Result<Task, ValidationError> {
    if (this.isCompleted) {
      return Result.fail(new ValidationError('Cannot update a completed task', 'status'));
    }

    if (updates.title !== undefined) {
      const titleValidation = Task.validateTitle(updates.title);
      if (titleValidation.isFail()) {
        return Result.fail(titleValidation.getError());
      }
    }

    if (updates.dueDate !== undefined) {
      const dueDateValidation = Task.validateDueDate(updates.dueDate);
      if (dueDateValidation.isFail()) {
        return Result.fail(dueDateValidation.getError());
      }
    }

    const updatedTask = new Task({
      ...this.props,
      title: updates.title ?? this.props.title,
      description: updates.description ?? this.props.description,
      priority: updates.priority ?? this.props.priority,
      dueDate: updates.dueDate ?? this.props.dueDate,
      updatedAt: new Date(),
    });

    return Result.ok(updatedTask);
  }

  /**
   * Start working on the task
   */
  start(): Result<Task, ValidationError> {
    if (!this.isPending) {
      return Result.fail(new ValidationError('Only pending tasks can be started', 'status'));
    }

    return Result.ok(
      new Task({
        ...this.props,
        status: 'in_progress',
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Complete the task
   */
  complete(): Result<Task, ValidationError> {
    if (this.isCompleted) {
      return Result.fail(new ValidationError('Task is already completed', 'status'));
    }

    return Result.ok(
      new Task({
        ...this.props,
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Reopen a completed task
   */
  reopen(): Result<Task, ValidationError> {
    if (!this.isCompleted) {
      return Result.fail(new ValidationError('Only completed tasks can be reopened', 'status'));
    }

    return Result.ok(
      new Task({
        ...this.props,
        status: 'pending',
        completedAt: undefined,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Assign task to a user
   */
  assignTo(userId: string): Result<Task, ValidationError> {
    const validation = Task.validateAssignedTo(userId, this.props.createdBy, this.props.partnerId);
    if (validation.isFail()) {
      return Result.fail(validation.getError());
    }

    return Result.ok(
      new Task({
        ...this.props,
        assignedTo: userId,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Unassign task
   */
  unassign(): Result<Task, ValidationError> {
    return Result.ok(
      new Task({
        ...this.props,
        assignedTo: undefined,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Change priority
   */
  setPriority(priority: TaskPriority): Result<Task, ValidationError> {
    if (this.isCompleted) {
      return Result.fail(new ValidationError('Cannot change priority of completed task', 'status'));
    }

    return Result.ok(
      new Task({
        ...this.props,
        priority,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Link to a goal
   */
  linkToGoal(goalId: string): Result<Task, ValidationError> {
    if (!goalId || goalId.trim().length === 0) {
      return Result.fail(new ValidationError('Goal ID is required', 'goalId'));
    }

    return Result.ok(
      new Task({
        ...this.props,
        goalId,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Unlink from goal
   */
  unlinkFromGoal(): Result<Task, ValidationError> {
    return Result.ok(
      new Task({
        ...this.props,
        goalId: undefined,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Check if user can modify this task
   */
  canBeModifiedBy(userId: string): boolean {
    return this.props.createdBy === userId || this.props.partnerId === userId;
  }

  /**
   * Check if task is assigned to user
   */
  isAssignedTo(userId: string): boolean {
    return this.props.assignedTo === userId;
  }

  /**
   * Convert to plain object for persistence
   */
  toJSON(): TaskProps {
    return { ...this.props };
  }

  /**
   * Check equality
   */
  equals(other: Task): boolean {
    return this.props.id === other.props.id;
  }
}
