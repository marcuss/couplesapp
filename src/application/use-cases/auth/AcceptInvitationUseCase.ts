/**
 * Accept Invitation Use Case
 * Handles accepting a partner invitation
 */

import { Result, AsyncResult } from '../../../shared/utils/Result';
import {
  DomainError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
  ValidationError,
} from '../../../domain/errors/DomainError';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IInvitationRepository } from '../../../domain/repositories/IInvitationRepository';

export interface AcceptInvitationDTO {
  invitationId: string;
  token: string;
  userId: string;
  userEmail: string;
}

export interface AcceptInvitationResult {
  success: boolean;
  partnerId: string;
  partnerEmail: string;
}

export class AcceptInvitationUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly invitationRepository: IInvitationRepository
  ) {}

  async execute(dto: AcceptInvitationDTO): AsyncResult<AcceptInvitationResult, DomainError> {
    // Validate input
    const validationError = this.validateInput(dto);
    if (validationError) {
      return Result.fail(validationError);
    }

    // Find the invitation
    const invitationResult = await this.invitationRepository.findById(dto.invitationId);
    if (invitationResult.isFail()) {
      return Result.fail(invitationResult.getError());
    }

    const invitation = invitationResult.getValue();
    if (!invitation) {
      return Result.fail(new NotFoundError('Invitation not found', 'Invitation', dto.invitationId));
    }

    // Validate token
    if (!invitation.validateToken(dto.token)) {
      return Result.fail(new UnauthorizedError('Invalid invitation token'));
    }

    // Check if invitation can be responded by this user
    if (!invitation.canBeRespondedBy(dto.userEmail)) {
      return Result.fail(
        new UnauthorizedError('This invitation was sent to a different email address')
      );
    }

    // Check if invitation is still active
    if (!invitation.isActive) {
      if (invitation.isExpired) {
        return Result.fail(new ConflictError('Invitation has expired'));
      }
      return Result.fail(new ConflictError('Invitation is no longer pending'));
    }

    // Find the accepting user
    const userResult = await this.userRepository.findById(dto.userId);
    if (userResult.isFail()) {
      return Result.fail(userResult.getError());
    }

    const user = userResult.getValue();
    if (!user) {
      return Result.fail(new NotFoundError('User not found', 'User', dto.userId));
    }

    // Check if user already has a partner
    if (user.hasPartner) {
      return Result.fail(new ConflictError('You already have a partner'));
    }

    // Find the inviter
    const inviterResult = await this.userRepository.findById(invitation.inviterId);
    if (inviterResult.isFail()) {
      return Result.fail(inviterResult.getError());
    }

    const inviter = inviterResult.getValue();
    if (!inviter) {
      return Result.fail(new NotFoundError('Inviter not found', 'User', invitation.inviterId));
    }

    // Check if inviter already has a partner
    if (inviter.hasPartner) {
      return Result.fail(new ConflictError('Inviter already has a partner'));
    }

    // Accept the invitation
    const acceptResult = invitation.accept();
    if (acceptResult.isFail()) {
      return Result.fail(acceptResult.getError());
    }

    const acceptedInvitation = acceptResult.getValue();

    // Connect the users as partners
    const userConnectResult = user.connectPartner(inviter.id);
    if (userConnectResult.isFail()) {
      return Result.fail(userConnectResult.getError());
    }

    const inviterConnectResult = inviter.connectPartner(user.id);
    if (inviterConnectResult.isFail()) {
      return Result.fail(inviterConnectResult.getError());
    }

    // Save all changes
    const updateInvitationResult = await this.invitationRepository.update(acceptedInvitation);
    if (updateInvitationResult.isFail()) {
      return Result.fail(updateInvitationResult.getError());
    }

    const updateUserResult = await this.userRepository.update(userConnectResult.getValue());
    if (updateUserResult.isFail()) {
      return Result.fail(updateUserResult.getError());
    }

    const updateInviterResult = await this.userRepository.update(inviterConnectResult.getValue());
    if (updateInviterResult.isFail()) {
      return Result.fail(updateInviterResult.getError());
    }

    return Result.ok({
      success: true,
      partnerId: inviter.id,
      partnerEmail: inviter.email,
    });
  }

  private validateInput(dto: AcceptInvitationDTO): ValidationError | null {
    if (!dto.invitationId || dto.invitationId.trim().length === 0) {
      return new ValidationError('Invitation ID is required', 'invitationId');
    }

    if (!dto.token || dto.token.trim().length === 0) {
      return new ValidationError('Token is required', 'token');
    }

    if (!dto.userId || dto.userId.trim().length === 0) {
      return new ValidationError('User ID is required', 'userId');
    }

    if (!dto.userEmail || dto.userEmail.trim().length === 0) {
      return new ValidationError('User email is required', 'userEmail');
    }

    return null;
  }
}
