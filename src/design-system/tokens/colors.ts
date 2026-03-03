/**
 * Design Tokens - Colors
 * Modern Romantic Theme for CouplePlan
 * 
 * Research-based color palette for 2026:
 * - Primary: Deep Rose (passion, love, warmth)
 * - Secondary: Soft Coral (warmth, intimacy)
 * - Accent: Warm Amber (energy, optimism)
 * - Neutral: Warm Gray (balance, sophistication)
 * 
 * Color Psychology for Couple Apps:
 * - Rose/Pink: Love, compassion, nurturing
 * - Coral: Warmth, connection, playfulness
 * - Amber: Happiness, energy, positivity
 * - Warm Neutrals: Comfort, stability, trust
 */

export const colors = {
  // Primary - Deep Rose (Love & Passion)
  primary: {
    50: '#FDF2F8',
    100: '#FCE7F3',
    200: '#FBCFE8',
    300: '#F9A8D4',
    400: '#F472B6',
    500: '#EC4899', // Main primary - vibrant rose
    600: '#DB2777',
    700: '#BE185D',
    800: '#9D174D',
    900: '#831843',
  },
  
  // Secondary - Soft Coral (Warmth & Intimacy)
  secondary: {
    50: '#FFF5F5',
    100: '#FFEBEB',
    200: '#FFD6D6',
    300: '#FFB3B3',
    400: '#FF8585',
    500: '#FF6B6B', // Warm coral
    600: '#EE5253',
    700: '#D63031',
    800: '#B71515',
    900: '#8A0E0E',
  },
  
  // Accent - Warm Amber (Energy & Positivity)
  accent: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Warm amber
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  
  // Success - Soft Green (Growth & Harmony)
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  
  // Error - Soft Red (Gentle warnings)
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  
  // Warning - Warm Orange
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  
  // Info - Soft Blue (Calm & Trust)
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  
  // Neutral - Cool Gray (Balance)
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Warm - Warm Gray (Comfort & Sophistication)
  warm: {
    50: '#FAFAF9',
    100: '#F5F5F4',
    200: '#E7E5E4',
    300: '#D6D3D1',
    400: '#A8A29E',
    500: '#78716C',
    600: '#57534E',
    700: '#44403C',
    800: '#292524',
    900: '#1C1917',
  },
  
  // Romantic - Special romantic shades
  romantic: {
    blush: '#FFD1DC',
    rose: '#FF69B4',
    passion: '#FF1493',
    love: '#DC143C',
    champagne: '#F7E7CE',
    gold: '#FFD700',
  },
} as const;

// Semantic color aliases for easier use
export const semanticColors = {
  // Backgrounds
  bgPrimary: colors.primary[500],
  bgSecondary: colors.secondary[500],
  bgAccent: colors.accent[500],
  
  // Text
  textPrimary: colors.gray[900],
  textSecondary: colors.gray[600],
  textMuted: colors.gray[400],
  
  // States
  success: colors.success[500],
  error: colors.error[500],
  warning: colors.warning[500],
  info: colors.info[500],
  
  // Romantic theme
  love: colors.romantic.love,
  rose: colors.romantic.rose,
  blush: colors.romantic.blush,
} as const;

export type ColorScale = typeof colors.primary;
export type ColorKey = keyof typeof colors;
