/**
 * OAuthButton Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { OAuthButton } from '../OAuthButton';

describe('OAuthButton — Google', () => {
  const onClick = vi.fn();

  beforeEach(() => {
    onClick.mockReset();
  });

  it('renders with accessible label', () => {
    render(<OAuthButton provider="google" onClick={onClick} />);
    expect(screen.getByTestId('oauth-button-google')).toBeInTheDocument();
    expect(screen.getByText('Continuar con Google')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    render(<OAuthButton provider="google" onClick={onClick} />);
    fireEvent.click(screen.getByTestId('oauth-button-google'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when isLoading=true', () => {
    render(<OAuthButton provider="google" onClick={onClick} isLoading />);
    const button = screen.getByTestId('oauth-button-google');
    expect(button).toBeDisabled();
  });

  it('is disabled when disabled=true', () => {
    render(<OAuthButton provider="google" onClick={onClick} disabled />);
    expect(screen.getByTestId('oauth-button-google')).toBeDisabled();
  });

  it('does not call onClick when disabled', () => {
    render(<OAuthButton provider="google" onClick={onClick} disabled />);
    fireEvent.click(screen.getByTestId('oauth-button-google'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('has aria-label', () => {
    render(<OAuthButton provider="google" onClick={onClick} />);
    expect(screen.getByLabelText('Continuar con Google')).toBeInTheDocument();
  });
});

describe('OAuthButton — Apple', () => {
  const onClick = vi.fn();

  beforeEach(() => {
    onClick.mockReset();
  });

  it('renders with accessible label', () => {
    render(<OAuthButton provider="apple" onClick={onClick} />);
    expect(screen.getByTestId('oauth-button-apple')).toBeInTheDocument();
    expect(screen.getByText('Continuar con Apple')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    render(<OAuthButton provider="apple" onClick={onClick} />);
    fireEvent.click(screen.getByTestId('oauth-button-apple'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when isLoading=true', () => {
    render(<OAuthButton provider="apple" onClick={onClick} isLoading />);
    expect(screen.getByTestId('oauth-button-apple')).toBeDisabled();
  });

  it('has aria-label', () => {
    render(<OAuthButton provider="apple" onClick={onClick} />);
    expect(screen.getByLabelText('Continuar con Apple')).toBeInTheDocument();
  });
});
