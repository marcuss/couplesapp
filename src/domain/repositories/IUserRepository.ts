/**
 * User Repository Interface (Port)
 * Defines the contract for user persistence operations
 */

import { AsyncResult } from '../../shared/utils/Result';
import { DomainError, NotFoundError } from '../errors/DomainError';
import { User } from '../entities/User';

export interface IUserRepository {
  /**
   * Find a user by their unique ID
   */
  findById(id: string): AsyncResult<User | null, DomainError>;

  /**
   * Find a user by their email address
   */
  findByEmail(email: string): AsyncResult<User | null, DomainError>;

  /**
   * Find a user by their partner ID
   */
  findByPartnerId(partnerId: string): AsyncResult<User | null, DomainError>;

  /**
   * Save a new user
   */
  save(user: User): AsyncResult<void, DomainError>;

  /**
   * Update an existing user
   */
  update(user: User): AsyncResult<void, NotFoundError | DomainError>;

  /**
   * Delete a user by ID
   */
  delete(id: string): AsyncResult<void, NotFoundError | DomainError>;

  /**
   * Check if a user exists by email
   */
  existsByEmail(email: string): AsyncResult<boolean, DomainError>;

  /**
   * Find users without a partner
   */
  findSingleUsers(): AsyncResult<User[], DomainError>;
}
