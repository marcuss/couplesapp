/**
 * Invitation Entity
 * Represents a partner invitation in the CouplePlan application
 */

import { Result } from '../../shared/utils/Result';
import { ValidationError, ConflictError } from '../errors/DomainError';

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export interface InvitationProps {
  id: string;
  inviterId: string;
  inviterEmail: string;
  inviteeEmail: string;
  status: InvitationStatus;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvitationProps {
  id: string;
  inviterId: string;
  inviterEmail: string;
  inviteeEmail: string;
  token: string;
  expiresInDays?: number;
}

export class Invitation {
  // Default expiration: 7 days
  private static readonly DEFAULT_EXPIRY_DAYS = 7;
  // Maximum expiration: 30 days
  private static readonly MAX_EXPIRY_DAYS = 30;

  private constructor(private readonly props: InvitationProps) {}

  /**
   * Create a new Invitation with validation
   */
  static create(props: CreateInvitationProps): Result<Invitation, ValidationError> {
    // Validate ID
    if (!props.id || props.id.trim().length === 0) {
      return Result.fail(new ValidationError('Invitation ID is required', 'id'));
    }

    // Validate inviterId
    if (!props.inviterId || props.inviterId.trim().length === 0) {
      return Result.fail(new ValidationError('Inviter ID is required', 'inviterId'));
    }

    // Validate inviterEmail
    const inviterEmailValidation = this.validateEmail(props.inviterEmail, 'inviterEmail');
    if (inviterEmailValidation.isFail()) {
      return Result.fail(inviterEmailValidation.getError());
    }

    // Validate inviteeEmail
    const inviteeEmailValidation = this.validateEmail(props.inviteeEmail, 'inviteeEmail');
    if (inviteeEmailValidation.isFail()) {
      return Result.fail(inviteeEmailValidation.getError());
    }

    // Check that inviter and invitee are different
    if (props.inviterEmail.toLowerCase() === props.inviteeEmail.toLowerCase()) {
      return Result.fail(
        new ValidationError('Cannot invite yourself', 'inviteeEmail')
      );
    }

    // Validate token
    if (!props.token || props.token.trim().length === 0) {
      return Result.fail(new ValidationError('Token is required', 'token'));
    }

    if (props.token.length < 32) {
      return Result.fail(new ValidationError('Token must be at least 32 characters', 'token'));
    }

    // Calculate expiration
    const expiresInDays = Math.min(
      props.expiresInDays ?? this.DEFAULT_EXPIRY_DAYS,
      this.MAX_EXPIRY_DAYS
    );
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invitation = new Invitation({
      ...props,
      status: 'pending',
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    return Result.ok(invitation);
  }

  /**
   * Reconstitute an Invitation from persistence (no validation)
   */
  static reconstitute(props: InvitationProps): Invitation {
    return new Invitation(props);
  }

  /**
   * Validate email format
   */
  private static validateEmail(
    email: string,
    field: string
  ): Result<void, ValidationError> {
    if (!email || email.trim().length === 0) {
      return Result.fail(new ValidationError('Email is required', field));
    }

    const emailRegex = /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return Result.fail(new ValidationError('Invalid email format', field));
    }

    return Result.ok(undefined);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get inviterId(): string {
    return this.props.inviterId;
  }

  get inviterEmail(): string {
    return this.props.inviterEmail;
  }

  get inviteeEmail(): string {
    return this.props.inviteeEmail;
  }

  get status(): InvitationStatus {
    return this.props.status;
  }

  get token(): string {
    return this.props.token;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get acceptedAt(): Date | undefined {
    return this.props.acceptedAt;
  }

  get rejectedAt(): Date | undefined {
    return this.props.rejectedAt;
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

  get isAccepted(): boolean {
    return this.props.status === 'accepted';
  }

  get isRejected(): boolean {
    return this.props.status === 'rejected';
  }

  get isExpired(): boolean {
    if (this.props.status === 'expired') return true;
    return new Date() > this.props.expiresAt;
  }

  get isActive(): boolean {
    return this.isPending && !this.isExpired;
  }

  get daysUntilExpiry(): number {
    const now = new Date();
    const diffTime = this.props.expiresAt.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Domain methods

  /**
   * Accept the invitation
   */
  accept(): Result<Invitation, ConflictError | ValidationError> {
    if (!this.isActive) {
      if (this.isExpired) {
        return Result.fail(new ConflictError('Invitation has expired'));
      }
      return Result.fail(new ConflictError('Invitation is no longer pending'));
    }

    return Result.ok(
      new Invitation({
        ...this.props,
        status: 'accepted',
        acceptedAt: new Date(),
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Reject the invitation
   */
  reject(): Result<Invitation, ConflictError | ValidationError> {
    if (!this.isActive) {
      if (this.isExpired) {
        return Result.fail(new ConflictError('Invitation has expired'));
      }
      return Result.fail(new ConflictError('Invitation is no longer pending'));
    }

    return Result.ok(
      new Invitation({
        ...this.props,
        status: 'rejected',
        rejectedAt: new Date(),
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Mark invitation as expired
   */
  markAsExpired(): Result<Invitation, ValidationError> {
    if (!this.isPending) {
      return Result.fail(
        new ValidationError('Only pending invitations can be marked as expired', 'status')
      );
    }

    return Result.ok(
      new Invitation({
        ...this.props,
        status: 'expired',
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Extend expiration date
   */
  extendExpiration(additionalDays: number): Result<Invitation, ValidationError> {
    if (!this.isPending) {
      return Result.fail(
        new ValidationError('Can only extend pending invitations', 'status')
      );
    }

    if (additionalDays <= 0) {
      return Result.fail(
        new ValidationError('Additional days must be positive', 'additionalDays')
      );
    }

    if (additionalDays > Invitation.MAX_EXPIRY_DAYS) {
      return Result.fail(
        new ValidationError(
          `Cannot extend by more than ${Invitation.MAX_EXPIRY_DAYS} days`,
          'additionalDays'
        )
      );
    }

    const newExpiresAt = new Date(this.props.expiresAt);
    newExpiresAt.setDate(newExpiresAt.getDate() + additionalDays);

    return Result.ok(
      new Invitation({
        ...this.props,
        expiresAt: newExpiresAt,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Check if invitation can be accepted/rejected by user
   */
  canBeRespondedBy(email: string): boolean {
    return this.props.inviteeEmail.toLowerCase() === email.toLowerCase();
  }

  /**
   * Check if invitation was sent by user
   */
  wasSentBy(userId: string): boolean {
    return this.props.inviterId === userId;
  }

  /**
   * Validate token
   */
  validateToken(token: string): boolean {
    return this.props.token === token;
  }

  /**
   * Convert to plain object for persistence
   */
  toJSON(): InvitationProps {
    return { ...this.props };
  }

  /**
   * Check equality
   */
  equals(other: Invitation): boolean {
    return this.props.id === other.props.id;
  }
}
