/**
 * Light Theme Configuration
 * Warm & Intimate Theme for CouplePlan
 */

import { colors } from '../tokens/colors';

export const lightTheme = {
  name: 'light',
  colors: {
    // Background colors
    background: {
      primary: colors.warm[50],
      secondary: colors.warm[100],
      tertiary: colors.warm[200],
      inverse: colors.warm[900],
    },
    // Text colors
    text: {
      primary: colors.warm[900],
      secondary: colors.warm[600],
      tertiary: colors.warm[400],
      inverse: colors.warm[50],
      disabled: colors.warm[400],
    },
    // Primary brand colors
    primary: {
      main: colors.primary[500],
      light: colors.primary[400],
      dark: colors.primary[600],
      contrast: '#FFFFFF',
    },
    // Secondary brand colors
    secondary: {
      main: colors.secondary[500],
      light: colors.secondary[400],
      dark: colors.secondary[600],
      contrast: '#FFFFFF',
    },
    // Accent colors
    accent: {
      main: colors.accent[500],
      light: colors.accent[400],
      dark: colors.accent[600],
      contrast: colors.warm[900],
    },
    // Semantic colors
    success: {
      main: colors.success[500],
      light: colors.success[400],
      dark: colors.success[600],
      background: colors.success[50],
    },
    error: {
      main: colors.error[500],
      light: colors.error[400],
      dark: colors.error[600],
      background: colors.error[50],
    },
    warning: {
      main: colors.warning[500],
      light: colors.warning[400],
      dark: colors.warning[600],
      background: colors.warning[50],
    },
    info: {
      main: colors.info[500],
      light: colors.info[400],
      dark: colors.info[600],
      background: colors.info[50],
    },
    // Border colors
    border: {
      light: colors.warm[200],
      main: colors.warm[300],
      dark: colors.warm[400],
    },
    // Shadow colors (with opacity)
    shadow: {
      sm: 'rgba(28, 25, 23, 0.05)',
      md: 'rgba(28, 25, 23, 0.1)',
      lg: 'rgba(28, 25, 23, 0.15)',
      xl: 'rgba(28, 25, 23, 0.2)',
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(28, 25, 23, 0.05)',
    md: '0 4px 6px -1px rgba(28, 25, 23, 0.1), 0 2px 4px -2px rgba(28, 25, 23, 0.1)',
    lg: '0 10px 15px -3px rgba(28, 25, 23, 0.1), 0 4px 6px -4px rgba(28, 25, 23, 0.1)',
    xl: '0 20px 25px -5px rgba(28, 25, 23, 0.1), 0 8px 10px -6px rgba(28, 25, 23, 0.1)',
    '2xl': '0 25px 50px -12px rgba(28, 25, 23, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(28, 25, 23, 0.05)',
    none: 'none',
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
} as const;

export type LightTheme = typeof lightTheme;
