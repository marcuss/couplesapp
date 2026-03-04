/**
 * Tests for appUrl utility
 * TDD: written before implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('appUrl utility', () => {
  const originalEnv = import.meta.env.VITE_APP_URL;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('getAppUrl()', () => {
    it('returns VITE_APP_URL when defined', async () => {
      vi.stubEnv('VITE_APP_URL', 'https://dlr56cmovhfn0.cloudfront.net');
      const { getAppUrl } = await import('../appUrl');
      expect(getAppUrl()).toBe('https://dlr56cmovhfn0.cloudfront.net');
    });

    it('returns window.location.origin as fallback when VITE_APP_URL is empty', async () => {
      vi.stubEnv('VITE_APP_URL', '');
      // Ensure window.location.origin is available (jsdom)
      const { getAppUrl } = await import('../appUrl');
      expect(getAppUrl()).toBe(window.location.origin);
    });

    it('trims trailing slash from VITE_APP_URL', async () => {
      vi.stubEnv('VITE_APP_URL', 'https://app.nextasy.co/');
      const { getAppUrl } = await import('../appUrl');
      expect(getAppUrl()).toBe('https://app.nextasy.co');
    });
  });

  describe('getInvitationUrl(token)', () => {
    it('returns full invitation URL with token', async () => {
      vi.stubEnv('VITE_APP_URL', 'https://app.nextasy.co');
      const { getInvitationUrl } = await import('../appUrl');
      const url = getInvitationUrl('abc-123-token');
      expect(url).toBe('https://app.nextasy.co/invitation/abc-123-token');
    });

    it('uses window.location.origin when env not set', async () => {
      vi.stubEnv('VITE_APP_URL', '');
      const { getInvitationUrl } = await import('../appUrl');
      const url = getInvitationUrl('my-token');
      expect(url).toBe(`${window.location.origin}/invitation/my-token`);
    });

    it('does not double-slash if base URL has trailing slash', async () => {
      vi.stubEnv('VITE_APP_URL', 'https://dlr56cmovhfn0.cloudfront.net/');
      const { getInvitationUrl } = await import('../appUrl');
      const url = getInvitationUrl('tok');
      expect(url).toBe('https://dlr56cmovhfn0.cloudfront.net/invitation/tok');
    });
  });
});
