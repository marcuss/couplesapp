/**
 * useDateIdeas hook tests
 * Verifies city detection, loading states, feedback, city change notification
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

vi.mock('../../lib/cityDetectionService', () => ({
  detectAndUpdateCity: vi.fn(),
  getCachedCity: vi.fn().mockReturnValue(null),
}));

// Mock Capacitor (not installed in test env)
vi.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    requestPermissions: vi.fn(),
    getCurrentPosition: vi.fn(),
  },
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

vi.mock('../../infrastructure/repositories/SupabaseDateIdeasRepository');
vi.mock('../../application/use-cases/dating-ideas/GetDateIdeasUseCase');
vi.mock('../../application/use-cases/dating-ideas/SubmitDateIdeasFeedbackUseCase');

import { useDateIdeas } from '../useDateIdeas';
import { detectAndUpdateCity, getCachedCity } from '../../lib/cityDetectionService';
import { GetDateIdeasUseCase } from '../../application/use-cases/dating-ideas/GetDateIdeasUseCase';
import { SubmitDateIdeasFeedbackUseCase } from '../../application/use-cases/dating-ideas/SubmitDateIdeasFeedbackUseCase';
import { SupabaseDateIdeasRepository } from '../../infrastructure/repositories/SupabaseDateIdeasRepository';
import { toast } from 'sonner';

const MOCK_IDEAS = {
  id: 'di-1',
  city: 'Medellín',
  date: '2026-03-04',
  ideas: [],
  cityNote: '',
  generatedAt: '2026-03-04T06:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCachedCity).mockReturnValue(null);
  vi.mocked(detectAndUpdateCity).mockResolvedValue({ city: 'Medellín', changed: false });

  // Re-setup constructors after clearAllMocks (clear doesn't reset implementations
  // but this ensures fresh mocks for constructor functions)
  vi.mocked(SupabaseDateIdeasRepository).mockImplementation(function(this: unknown) {
    return {
      getIdeasForCity: vi.fn().mockResolvedValue(null),
      saveFeedback: vi.fn().mockResolvedValue(undefined),
      getPersonalizedIdeas: vi.fn().mockResolvedValue(null),
    };
  } as unknown as typeof SupabaseDateIdeasRepository);

  vi.mocked(GetDateIdeasUseCase).mockImplementation(function(this: unknown) {
    return { execute: vi.fn().mockResolvedValue(MOCK_IDEAS) };
  } as unknown as typeof GetDateIdeasUseCase);

  vi.mocked(SubmitDateIdeasFeedbackUseCase).mockImplementation(function(this: unknown) {
    return { execute: vi.fn().mockResolvedValue(MOCK_IDEAS) };
  } as unknown as typeof SubmitDateIdeasFeedbackUseCase);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useDateIdeas', () => {
  it('starts with idle or detecting-city status', () => {
    const { result } = renderHook(() => useDateIdeas());
    expect(['idle', 'detecting-city']).toContain(result.current.status);
  });

  it('reaches loaded state after city detection + fetch', async () => {
    const { result } = renderHook(() => useDateIdeas());
    await waitFor(() => expect(result.current.status).toBe('loaded'));
    expect(result.current.ideas).toEqual(MOCK_IDEAS);
    expect(result.current.city).toBe('Medellín');
  });

  it('shows toast when city changes', async () => {
    vi.mocked(detectAndUpdateCity).mockResolvedValue({ city: 'Cartagena', changed: true });
    vi.mocked(GetDateIdeasUseCase).mockImplementation(function(this: unknown) {
      return { execute: vi.fn().mockResolvedValue({ ...MOCK_IDEAS, city: 'Cartagena' }) };
    } as unknown as typeof GetDateIdeasUseCase);

    renderHook(() => useDateIdeas());
    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith(expect.stringContaining('Cartagena'));
    });
  });

  it('does NOT show toast when city did not change', async () => {
    vi.mocked(detectAndUpdateCity).mockResolvedValue({ city: 'Medellín', changed: false });
    renderHook(() => useDateIdeas());
    await waitFor(() => {});
    expect(toast.info).not.toHaveBeenCalled();
  });

  it('reaches empty state when execute returns null', async () => {
    vi.mocked(GetDateIdeasUseCase).mockImplementation(function(this: unknown) {
      return { execute: vi.fn().mockResolvedValue(null) };
    } as unknown as typeof GetDateIdeasUseCase);
    const { result } = renderHook(() => useDateIdeas());
    await waitFor(() => expect(result.current.status).toBe('empty'));
  });

  it('reaches empty state when GPS returns no city', async () => {
    vi.mocked(detectAndUpdateCity).mockResolvedValue({ city: '', changed: false });
    const { result } = renderHook(() => useDateIdeas());
    await waitFor(() => expect(result.current.status).toBe('empty'));
  });

  it('skips GPS detection when overrideCity is provided', async () => {
    renderHook(() => useDateIdeas('Bogotá'));
    await waitFor(() => {});
    expect(detectAndUpdateCity).not.toHaveBeenCalled();
  });

  it('uses overrideCity for the fetch', async () => {
    const execute = vi.fn().mockResolvedValue({ ...MOCK_IDEAS, city: 'Bogotá' });
    vi.mocked(GetDateIdeasUseCase).mockImplementation(function(this: unknown) {
      return { execute };
    } as unknown as typeof GetDateIdeasUseCase);

    const { result } = renderHook(() => useDateIdeas('Bogotá'));
    await waitFor(() => expect(result.current.status).toBe('loaded'));
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ city: 'Bogotá' })
    );
  });

  it('transitions to personalizing then personalized on submitFeedback', async () => {
    // Rely on beforeEach mock (already set up with function keyword)
    const { result } = renderHook(() => useDateIdeas());
    await waitFor(() => expect(result.current.status).toBe('loaded'));

    act(() => {
      result.current.submitFeedback('user-1', 'outdoor please');
    });

    // Should go through personalizing → personalized
    await waitFor(() => expect(result.current.status).toBe('personalized'));
    expect(toast.success).toHaveBeenCalled();
    expect(result.current.ideas).toEqual(MOCK_IDEAS);
  });

  it('transitions to error state on submitFeedback failure', async () => {
    vi.mocked(SubmitDateIdeasFeedbackUseCase).mockImplementation(function(this: unknown) {
      return { execute: vi.fn().mockRejectedValue(new Error('API down')) };
    } as unknown as typeof SubmitDateIdeasFeedbackUseCase);

    const { result } = renderHook(() => useDateIdeas('Bogotá'));
    await waitFor(() => expect(result.current.status).toBe('loaded'));

    act(() => {
      result.current.submitFeedback('u1', 'feedback');
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('API down');
  });

  it('exposes today as YYYY-MM-DD string', () => {
    const { result } = renderHook(() => useDateIdeas());
    expect(result.current.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('re-runs load when overrideCity changes', async () => {
    let overrideCity = 'Medellín';
    const { rerender } = renderHook(() => useDateIdeas(overrideCity));
    await waitFor(() => {});

    const execute = vi.mocked(GetDateIdeasUseCase).mock.results[0]?.value?.execute;
    const callCount = (execute as ReturnType<typeof vi.fn>)?.mock.calls.length ?? 0;

    overrideCity = 'Cali';
    rerender();
    await waitFor(() => {});

    expect((execute as ReturnType<typeof vi.fn>)?.mock.calls.length).toBeGreaterThan(callCount);
  });
});
