/**
 * Login Use Case
 * Handles user authentication
 */

import { Result, AsyncResult } from '../../../shared/utils/Result';
import { DomainError, UnauthorizedError, ValidationError } from '../../../domain/errors/DomainError';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { LoginDTO, LoginResult } from '../../dto/LoginDTO';

export interface IAuthService {
  signIn(email: string, password: string): AsyncResult<{
    user: { id: string; email: string };
    session: { accessToken: string; refreshToken: string; expiresAt: number };
  }, Error>;
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authService: IAuthService
  ) {}

  async execute(dto: LoginDTO): AsyncResult<LoginResult, DomainError> {
    // Validate input
    const validationError = this.validateInput(dto);
    if (validationError) {
      return Result.fail(validationError);
    }

    // Authenticate with auth service
    const authResult = await this.authService.signIn(dto.email, dto.password);
    if (authResult.isFail()) {
      return Result.fail(new UnauthorizedError('Invalid credentials'));
    }

    const authData = authResult.getValue();

    // Fetch user details from repository
    const userResult = await this.userRepository.findById(authData.user.id);
    if (userResult.isFail()) {
      return Result.fail(userResult.getError());
    }

    const user = userResult.getValue();
    if (!user) {
      return Result.fail(new UnauthorizedError('User not found'));
    }

    // Return login result
    return Result.ok({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        hasPartner: user.hasPartner,
      },
      session: authData.session,
    });
  }

  private validateInput(dto: LoginDTO): ValidationError | null {
    if (!dto.email || dto.email.trim().length === 0) {
      return new ValidationError('Email is required', 'email');
    }

    const emailRegex = /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(dto.email)) {
      return new ValidationError('Invalid email format', 'email');
    }

    if (!dto.password || dto.password.length === 0) {
      return new ValidationError('Password is required', 'password');
    }

    if (dto.password.length < 6) {
      return new ValidationError('Password must be at least 6 characters', 'password');
    }

    return null;
  }
}
