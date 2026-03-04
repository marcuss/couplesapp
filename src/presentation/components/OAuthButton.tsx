/**
 * OAuthButton Component
 * Reusable OAuth login button for Google and Apple providers
 */

import React from 'react';

type OAuthProvider = 'google' | 'apple';

interface OAuthButtonProps {
  provider: OAuthProvider;
  onClick: () => void | Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
}

// Google color logo SVG (inline, no external dependencies)
const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// Apple logo SVG (inline)
const AppleIcon: React.FC<{ className?: string; color?: string }> = ({
  className,
  color = 'currentColor',
}) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 814 1000"
    aria-hidden="true"
    fill={color}
  >
    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.9 0 663.8 0 542.8c0-207.4 135.4-317 268.1-317 71 0 130.5 46.9 175 46.9 42.7 0 109.1-49.9 192.6-49.9 31.1 0 108.2 3.2 164.6 97.3zm-174.7-93.6c-8.3-44.3-56.5-95.9-108.2-95.9-2.6 0-5.1.3-7.7.6 3.8 49 49.9 95.2 108.2 95.2 2.6 0 5.1-.3 7.7-.6l-.0001.7z" />
  </svg>
);

// Spinner icon
const Spinner: React.FC = () => (
  <svg
    className="animate-spin h-5 w-5"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const providerConfig = {
  google: {
    label: 'Continuar con Google',
    icon: <GoogleIcon className="h-5 w-5" />,
    buttonClass:
      'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600',
    testId: 'oauth-button-google',
  },
  apple: {
    label: 'Continuar con Apple',
    icon: <AppleIcon className="h-5 w-5" color="white" />,
    buttonClass:
      'bg-black dark:bg-gray-900 text-white border border-black dark:border-gray-700 hover:bg-gray-900 dark:hover:bg-black',
    testId: 'oauth-button-apple',
  },
} as const;

export const OAuthButton: React.FC<OAuthButtonProps> = ({
  provider,
  onClick,
  isLoading = false,
  disabled = false,
}) => {
  const config = providerConfig[provider];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading || disabled}
      data-testid={config.testId}
      aria-label={config.label}
      className={`
        w-full flex items-center justify-center gap-3
        py-3 px-4 rounded-lg font-medium text-sm
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${config.buttonClass}
      `}
    >
      {isLoading ? <Spinner /> : config.icon}
      <span>{config.label}</span>
    </button>
  );
};

export default OAuthButton;
