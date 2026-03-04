/**
 * Password Value Object
 *
 * Encapsulates password validation rules:
 * 1. Minimum 8 characters
 * 2. At least 1 uppercase letter (A-Z)
 * 3. At least 1 lowercase letter (a-z)
 * 4. At least 1 special symbol (!@#$%^&*()_+-=[]{}|;':",./<>?)
 * 5. At least 1 number (0-9)
 *
 * Immutable — use Password.create() factory.
 */

import { Result } from '../../shared/utils/Result';
import { ValidationError } from '../errors/DomainError';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'strong' | 'very-strong';
  checks: {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasSpecialChar: boolean;
    hasNumber: boolean;
  };
}

export class PasswordError extends ValidationError {
  constructor(
    message: string,
    public readonly violations: string[]
  ) {
    super(message, 'password');
    Object.setPrototypeOf(this, PasswordError.prototype);
  }
}

const SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{}|;':",./<>?]/;
const UPPERCASE = /[A-Z]/;
const LOWERCASE = /[a-z]/;
const NUMBER = /[0-9]/;
const MIN_LENGTH = 8;

/**
 * Validate a raw password string and return detailed checks.
 * This is a pure function — no domain entity instantiation needed.
 */
export function validatePasswordRules(raw: string): PasswordValidationResult {
  const checks = {
    minLength: raw.length >= MIN_LENGTH,
    hasUpperCase: UPPERCASE.test(raw),
    hasLowerCase: LOWERCASE.test(raw),
    hasSpecialChar: SPECIAL_CHARS.test(raw),
    hasNumber: NUMBER.test(raw),
  };

  const errors: string[] = [];
  if (!checks.minLength)
    errors.push(`Password must be at least ${MIN_LENGTH} characters long`);
  if (!checks.hasUpperCase)
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  if (!checks.hasLowerCase)
    errors.push('Password must contain at least one lowercase letter (a-z)');
  if (!checks.hasSpecialChar)
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;\':",./<>?)');
  if (!checks.hasNumber)
    errors.push('Password must contain at least one number (0-9)');

  const passedCount = Object.values(checks).filter(Boolean).length;
  let strength: PasswordValidationResult['strength'];
  if (passedCount <= 1) strength = 'weak';
  else if (passedCount === 2) strength = 'fair';
  else if (passedCount === 3 || passedCount === 4) strength = 'fair';
  else strength = raw.length >= 12 ? 'very-strong' : 'strong';

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    checks,
  };
}

export class Password {
  private constructor(private readonly _value: string) {}

  /**
   * Factory: validates all rules and returns Result<Password, PasswordError>
   */
  static create(raw: string): Result<Password, PasswordError> {
    if (!raw || raw.length === 0) {
      return Result.fail(
        new PasswordError('Password is required', ['Password is required'])
      );
    }

    const validation = validatePasswordRules(raw);

    if (!validation.isValid) {
      const primaryMessage = validation.errors[0];
      return Result.fail(new PasswordError(primaryMessage, validation.errors));
    }

    return Result.ok(new Password(raw));
  }

  /**
   * Get the raw password value.
   * Only expose where necessary (e.g., passing to auth service).
   */
  get value(): string {
    return this._value;
  }

  /**
   * Get validation details for the current password.
   */
  get validationDetails(): PasswordValidationResult {
    return validatePasswordRules(this._value);
  }

  /**
   * Equality check
   */
  equals(other: Password): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return '***';
  }
}
