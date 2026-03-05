/**
 * SignInWithGoogle Use Case
 * Initiates the Google OAuth flow via the auth repository
 */

import { Result, AsyncResult } from '../../../shared/utils/Result';
import { DomainError } from '../../../domain/errors/DomainError';
import { IAuthRepository } from '../../../domain/repositories/IAuthRepository';

export class SignInWithGoogleUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(): AsyncResult<void, DomainError> {
    return this.authRepository.signInWithGoogle();
  }
}
