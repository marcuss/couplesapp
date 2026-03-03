/**
 * User Entity
 * Represents a user in the CouplePlan application
 */

import { Result } from '../../shared/utils/Result';
import { ValidationError } from '../errors/DomainError';

export interface UserProps {
  id: string;
  email: string;
  name: string;
  partnerId?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserProps {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  /**
   * Create a new User with validation
   */
  static create(props: CreateUserProps): Result<User, ValidationError> {
    // Validate ID
    if (!props.id || props.id.trim().length === 0) {
      return Result.fail(new ValidationError('User ID is required', 'id'));
    }

    // Validate email
    const emailValidation = this.validateEmail(props.email);
    if (emailValidation.isFail()) {
      return Result.fail(emailValidation.getError());
    }

    // Validate name
    const nameValidation = this.validateName(props.name);
    if (nameValidation.isFail()) {
      return Result.fail(nameValidation.getError());
    }

    const now = new Date();
    const user = new User({
      ...props,
      partnerId: undefined,
      createdAt: now,
      updatedAt: now,
    });

    return Result.ok(user);
  }

  /**
   * Reconstitute a User from persistence (no validation)
   */
  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  /**
   * Validate email format
   */
  private static validateEmail(email: string): Result<void, ValidationError> {
    if (!email || email.trim().length === 0) {
      return Result.fail(new ValidationError('Email is required', 'email'));
    }

    // RFC 5322 compliant regex (simplified)
    const emailRegex = /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return Result.fail(new ValidationError('Invalid email format', 'email'));
    }

    return Result.ok(undefined);
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

  // Getters
  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get name(): string {
    return this.props.name;
  }

  get partnerId(): string | undefined {
    return this.props.partnerId;
  }

  get avatarUrl(): string | undefined {
    return this.props.avatarUrl;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get hasPartner(): boolean {
    return this.props.partnerId !== undefined && this.props.partnerId !== null;
  }

  // Domain methods

  /**
   * Connect with a partner
   */
  connectPartner(partnerId: string): Result<User, ValidationError> {
    if (!partnerId || partnerId.trim().length === 0) {
      return Result.fail(new ValidationError('Partner ID is required', 'partnerId'));
    }

    if (this.props.partnerId === partnerId) {
      return Result.fail(new ValidationError('Cannot connect to yourself', 'partnerId'));
    }

    if (this.props.partnerId) {
      return Result.fail(new ValidationError('User already has a partner', 'partnerId'));
    }

    const updatedUser = new User({
      ...this.props,
      partnerId,
      updatedAt: new Date(),
    });

    return Result.ok(updatedUser);
  }

  /**
   * Disconnect from partner
   */
  disconnectPartner(): Result<User, ValidationError> {
    if (!this.props.partnerId) {
      return Result.fail(new ValidationError('User does not have a partner', 'partnerId'));
    }

    const updatedUser = new User({
      ...this.props,
      partnerId: undefined,
      updatedAt: new Date(),
    });

    return Result.ok(updatedUser);
  }

  /**
   * Update user profile
   */
  updateProfile(updates: { name?: string; avatarUrl?: string }): Result<User, ValidationError> {
    if (updates.name !== undefined) {
      const nameValidation = User.validateName(updates.name);
      if (nameValidation.isFail()) {
        return Result.fail(nameValidation.getError());
      }
    }

    const updatedUser = new User({
      ...this.props,
      name: updates.name ?? this.props.name,
      avatarUrl: updates.avatarUrl ?? this.props.avatarUrl,
      updatedAt: new Date(),
    });

    return Result.ok(updatedUser);
  }

  /**
   * Convert to plain object for persistence
   */
  toJSON(): UserProps {
    return { ...this.props };
  }

  /**
   * Check equality
   */
  equals(other: User): boolean {
    return this.props.id === other.props.id;
  }
}
