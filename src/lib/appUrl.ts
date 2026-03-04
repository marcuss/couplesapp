/**
 * App URL utilities
 * Centralizes the base URL for the app and generates invitation links.
 * Uses VITE_APP_URL env var; falls back to window.location.origin.
 */

export function getAppUrl(): string {
  const envUrl: string = import.meta.env.VITE_APP_URL ?? '';
  const base = envUrl.trim().replace(/\/+$/, '');
  if (base) return base;
  return typeof window !== 'undefined' ? window.location.origin : '';
}

export function getInvitationUrl(token: string): string {
  return `${getAppUrl()}/invitation/${token}`;
}
