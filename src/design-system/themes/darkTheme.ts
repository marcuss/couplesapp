/**
 * Dark Theme Configuration
 * Warm & Intimate Theme for CouplePlan
 */

import { colors } from '../tokens/colors';

export const darkTheme = {
  name: 'dark',
  colors: {
    // Background colors
    background: {
      primary: colors.warm[900],
      secondary: colors.warm[800],
      tertiary: colors.warm[700],
      inverse: colors.warm[50],
    },
    // Text colors
    text: {
      primary: colors.warm[50],
      secondary: colors.warm[400],
      tertiary: colors.warm[500],
      inverse: colors.warm[900],
      disabled: colors.warm[600],
    },
    // Primary brand colors
    primary: {
      main: colors.primary[400],
      light: colors.primary[300],
      dark: colors.primary[500],
      contrast: colors.warm[900],
    },
    // Secondary brand colors
    secondary: {
      main: colors.secondary[400],
      light: colors.secondary[300],
      dark: colors.secondary[500],
      contrast: colors.warm[900],
    },
    // Accent colors
    accent: {
      main: colors.accent[400],
      light: colors.accent[300],
      dark: colors.accent[500],
      contrast: colors.warm[900],
    },
    // Semantic colors
    success: {
      main: colors.success[400],
      light: colors.success[300],
      dark: colors.success[500],
      background: colors.success[900],
    },
    error: {
      main: colors.error[400],
      light: colors.error[300],
      dark: colors.error[500],
      background: colors.error[900],
    },
    warning: {
      main: colors.warning[400],
      light: colors.warning[300],
      dark: colors.warning[500],
      background: colors.warning[900],
    },
    info: {
      main: colors.info[400],
      light: colors.info[300],
      dark: colors.info[500],
      background: colors.info[900],
    },
    // Border colors
    border: {
      light: colors.warm[700],
      main: colors.warm[600],
      dark: colors.warm[500],
    },
    // Shadow colors (with opacity)
    shadow: {
      sm: 'rgba(0, 0, 0, 0.2)',
      md: 'rgba(0, 0, 0, 0.3)',
      lg: 'rgba(0, 0, 0, 0.4)',
      xl: 'rgba(0, 0, 0, 0.5)',
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
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

export type DarkTheme = typeof darkTheme;
