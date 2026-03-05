/**
 * Auth Repository Interface (Port)
 * Defines the contract for OAuth authentication operations
 */

import { AsyncResult } from '../../shared/utils/Result';
import { DomainError } from '../errors/DomainError';
import { User } from '../entities/User';

export interface IAuthRepository {
  /**
   * Initiate Google OAuth flow — redirects to Google
   */
  signInWithGoogle(): AsyncResult<void, DomainError>;

  /**
   * Initiate Apple OAuth flow — redirects to Apple
   */
  signInWithApple(): AsyncResult<void, DomainError>;

  /**
   * Handle OAuth callback after redirect from provider.
   * Parses the URL hash/params, exchanges code for session,
   * and returns the authenticated User (creating a profile if needed).
   */
  handleOAuthCallback(url?: string): AsyncResult<User, DomainError>;
}
