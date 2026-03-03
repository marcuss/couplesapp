/**
 * Invitation Repository Interface (Port)
 * Defines the contract for invitation persistence operations
 */

import { AsyncResult } from '../../shared/utils/Result';
import { DomainError, NotFoundError } from '../errors/DomainError';
import { Invitation, InvitationStatus } from '../entities/Invitation';

export interface IInvitationRepository {
  /**
   * Find an invitation by its unique ID
   */
  findById(id: string): AsyncResult<Invitation | null, DomainError>;

  /**
   * Find an invitation by its token
   */
  findByToken(token: string): AsyncResult<Invitation | null, DomainError>;

  /**
   * Find invitations sent by a user
   */
  findByInviter(inviterId: string): AsyncResult<Invitation[], DomainError>;

  /**
   * Find invitations sent to an email
   */
  findByInviteeEmail(email: string): AsyncResult<Invitation[], DomainError>;

  /**
   * Find pending invitations sent by a user
   */
  findPendingByInviter(inviterId: string): AsyncResult<Invitation[], DomainError>;

  /**
   * Find pending invitations for an email
   */
  findPendingByEmail(email: string): AsyncResult<Invitation[], DomainError>;

  /**
   * Find invitations by status
   */
  findByStatus(
    inviterId: string,
    status: InvitationStatus
  ): AsyncResult<Invitation[], DomainError>;

  /**
   * Find expired pending invitations
   */
  findExpired(): AsyncResult<Invitation[], DomainError>;

  /**
   * Save a new invitation
   */
  save(invitation: Invitation): AsyncResult<void, DomainError>;

  /**
   * Update an existing invitation
   */
  update(invitation: Invitation): AsyncResult<void, NotFoundError | DomainError>;

  /**
   * Delete an invitation by ID
   */
  delete(id: string): AsyncResult<void, NotFoundError | DomainError>;

  /**
   * Check if user has pending invitations
   */
  hasPendingInvitations(inviterId: string): AsyncResult<boolean, DomainError>;

  /**
   * Check if email has pending invitations
   */
  hasPendingInvitationsForEmail(email: string): AsyncResult<boolean, DomainError>;

  /**
   * Count pending invitations sent by a user
   */
  countPendingByInviter(inviterId: string): AsyncResult<number, DomainError>;
}
