/**
 * Password Value Object — TDD Tests
 */
import { describe, it, expect } from 'vitest';
import { Password, PasswordError, validatePasswordRules } from '../Password';

// ─── Password.create() ───────────────────────────────────────────────────────

describe('Password.create()', () => {
  // ── Valid passwords ────────────────────────────────────────────────────────

  it('accepts a valid password with all requirements', () => {
    const result = Password.create('Secure@123');
    expect(result.isOk()).toBe(true);
  });

  it('accepts password with symbol at the beginning', () => {
    const result = Password.create('!Secure123');
    expect(result.isOk()).toBe(true);
  });

  it('accepts password with symbol at the end', () => {
    const result = Password.create('Secure123!');
    expect(result.isOk()).toBe(true);
  });

  it('accepts password with multiple special characters', () => {
    const result = Password.create('S!e#c$u%r^e123');
    expect(result.isOk()).toBe(true);
  });

  it('accepts password with exactly 8 characters meeting all rules', () => {
    const result = Password.create('Secure1!');
    expect(result.isOk()).toBe(true);
  });

  it('accepts long password (>= 12 chars) and reports very-strong strength', () => {
    const result = Password.create('SuperSecure@123!');
    expect(result.isOk()).toBe(true);
    const pw = result.getValue();
    expect(pw.validationDetails.strength).toBe('very-strong');
  });

  it('exposes the raw value via .value getter', () => {
    const raw = 'Secure@123';
    const pw = Password.create(raw).getValue();
    expect(pw.value).toBe(raw);
  });

  it('toString() returns masked string (not the real password)', () => {
    const pw = Password.create('Secure@123').getValue();
    expect(pw.toString()).toBe('***');
  });

  it('two passwords with same value are equal', () => {
    const p1 = Password.create('Secure@123').getValue();
    const p2 = Password.create('Secure@123').getValue();
    expect(p1.equals(p2)).toBe(true);
  });

  it('two passwords with different values are not equal', () => {
    const p1 = Password.create('Secure@123').getValue();
    const p2 = Password.create('Secure@456').getValue();
    expect(p1.equals(p2)).toBe(false);
  });

  // ── Invalid: too short ─────────────────────────────────────────────────────

  it('rejects password shorter than 8 characters', () => {
    const result = Password.create('Sec@1');
    expect(result.isFail()).toBe(true);
    const err = result.getError();
    expect(err).toBeInstanceOf(PasswordError);
    expect(err.violations.some(v => v.toLowerCase().includes('8 characters'))).toBe(true);
  });

  it('rejects 7-character password', () => {
    const result = Password.create('Secur1!');
    expect(result.isFail()).toBe(true);
  });

  it('rejects empty string', () => {
    const result = Password.create('');
    expect(result.isFail()).toBe(true);
    expect(result.getError().violations[0]).toContain('required');
  });

  // ── Invalid: missing uppercase ─────────────────────────────────────────────

  it('rejects password without uppercase letter', () => {
    const result = Password.create('secure@123');
    expect(result.isFail()).toBe(true);
    const err = result.getError();
    expect(err.violations.some(v => v.toLowerCase().includes('uppercase'))).toBe(true);
  });

  // ── Invalid: missing lowercase ─────────────────────────────────────────────

  it('rejects password without lowercase letter', () => {
    const result = Password.create('SECURE@123');
    expect(result.isFail()).toBe(true);
    const err = result.getError();
    expect(err.violations.some(v => v.toLowerCase().includes('lowercase'))).toBe(true);
  });

  // ── Invalid: missing special character ────────────────────────────────────

  it('rejects password without special character', () => {
    const result = Password.create('Secure1234');
    expect(result.isFail()).toBe(true);
    const err = result.getError();
    expect(err.violations.some(v => v.toLowerCase().includes('special'))).toBe(true);
  });

  // ── Invalid: missing number ────────────────────────────────────────────────

  it('rejects password without a number', () => {
    const result = Password.create('Secure@abc');
    expect(result.isFail()).toBe(true);
    const err = result.getError();
    expect(err.violations.some(v => v.toLowerCase().includes('number'))).toBe(true);
  });

  // ── Error field ────────────────────────────────────────────────────────────

  it('PasswordError has field set to "password"', () => {
    const err = Password.create('bad').getError();
    expect(err.field).toBe('password');
  });

  it('PasswordError carries descriptive message for each failing rule', () => {
    // All rules missing
    const result = Password.create('a');
    expect(result.isFail()).toBe(true);
    const { violations } = result.getError();
    // At least 4 violations: minLength, uppercase, specialChar, number
    expect(violations.length).toBeGreaterThanOrEqual(4);
  });
});

// ─── validatePasswordRules() ─────────────────────────────────────────────────

describe('validatePasswordRules()', () => {
  it('returns all checks true for a valid password', () => {
    const result = validatePasswordRules('Secure@123');
    expect(result.isValid).toBe(true);
    expect(result.checks.minLength).toBe(true);
    expect(result.checks.hasUpperCase).toBe(true);
    expect(result.checks.hasLowerCase).toBe(true);
    expect(result.checks.hasSpecialChar).toBe(true);
    expect(result.checks.hasNumber).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('reports minLength false for short password', () => {
    const result = validatePasswordRules('Sc@1');
    expect(result.checks.minLength).toBe(false);
  });

  it('reports hasUpperCase false when no uppercase', () => {
    const result = validatePasswordRules('secure@123');
    expect(result.checks.hasUpperCase).toBe(false);
  });

  it('reports hasLowerCase false when no lowercase', () => {
    const result = validatePasswordRules('SECURE@123');
    expect(result.checks.hasLowerCase).toBe(false);
  });

  it('reports hasSpecialChar false when no special char', () => {
    const result = validatePasswordRules('Secure1234');
    expect(result.checks.hasSpecialChar).toBe(false);
  });

  it('reports hasNumber false when no digit', () => {
    const result = validatePasswordRules('Secure@abc');
    expect(result.checks.hasNumber).toBe(false);
  });

  it('returns strength "very-strong" for long valid password', () => {
    const result = validatePasswordRules('SuperSecure@123!');
    expect(result.strength).toBe('very-strong');
  });

  it('returns strength "strong" for 8-char valid password', () => {
    const result = validatePasswordRules('Secure1!');
    expect(result.strength).toBe('strong');
  });
});
