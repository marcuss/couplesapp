/**
 * HandleOAuthCallback Use Case
 * Processes the OAuth redirect URL and returns the authenticated User
 */

import { AsyncResult } from '../../../shared/utils/Result';
import { DomainError } from '../../../domain/errors/DomainError';
import { User } from '../../../domain/entities/User';
import { IAuthRepository } from '../../../domain/repositories/IAuthRepository';

export interface HandleOAuthCallbackDTO {
  url?: string;
}

export class HandleOAuthCallbackUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(dto?: HandleOAuthCallbackDTO): AsyncResult<User, DomainError> {
    return this.authRepository.handleOAuthCallback(dto?.url);
  }
}
