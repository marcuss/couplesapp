/**
 * useDateIdeas hook
 *
 * Orchestrates:
 * 1. City detection (localStorage cache + GPS background verification)
 * 2. Loading AI-generated date ideas for the resolved city
 * 3. Feedback submission → personalized ideas
 *
 * City resolution strategy:
 * - If `overrideCity` is provided (e.g. from the user's profile) → use it directly.
 * - Otherwise call `detectAndUpdateCity()` which reads localStorage first, then
 *   verifies with GPS in the background.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { DateIdeas } from '../domain/entities/DateIdea';
import { GetDateIdeasUseCase } from '../application/use-cases/dating-ideas/GetDateIdeasUseCase';
import { SubmitDateIdeasFeedbackUseCase } from '../application/use-cases/dating-ideas/SubmitDateIdeasFeedbackUseCase';
import { SupabaseDateIdeasRepository } from '../infrastructure/repositories/SupabaseDateIdeasRepository';
import {
  detectAndUpdateCity,
  getCachedCity,
} from '../lib/cityDetectionService';

// ─── Types ───────────────────────────────────────────────────────────────────

export type UseDateIdeasStatus =
  | 'idle'
  | 'detecting-city'
  | 'loading'
  | 'loaded'
  | 'empty'
  | 'error'
  | 'personalizing'
  | 'personalized';

export interface UseDateIdeasState {
  status: UseDateIdeasStatus;
  ideas: DateIdeas | null;
  city: string | null;
  error: string | null;
}

export interface UseDateIdeasResult extends UseDateIdeasState {
  today: string;
  submitFeedback: (userId: string, feedbackText: string) => Promise<void>;
  reload: () => void;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * @param overrideCity  Optional explicit city (e.g. from user profile).
 *                      When provided, GPS detection is skipped.
 */
export function useDateIdeas(overrideCity?: string | null): UseDateIdeasResult {
  const today = getTodayString();

  const [state, setState] = useState<UseDateIdeasState>(() => {
    // Seed city from localStorage to avoid flicker on re-render
    const cached = getCachedCity();
    return {
      status: 'idle',
      ideas: null,
      city: overrideCity ?? cached ?? null,
      error: null,
    };
  });

  // Keep a stable repo / use-case ref (avoid re-creating on every render)
  const repoRef = useRef(new SupabaseDateIdeasRepository());
  const getUseCaseRef = useRef(new GetDateIdeasUseCase(repoRef.current));
  const feedbackUseCaseRef = useRef(
    new SubmitDateIdeasFeedbackUseCase(repoRef.current)
  );

  // ── Fetch ideas for a given city ─────────────────────────────────────────
  const fetchIdeasForCity = useCallback(
    async (city: string) => {
      setState((s) => ({ ...s, status: 'loading', city, error: null }));
      try {
        const ideas = await getUseCaseRef.current.execute({ city, date: today });
        if (ideas) {
          setState((s) => ({ ...s, status: 'loaded', ideas, city }));
        } else {
          setState((s) => ({ ...s, status: 'empty', ideas: null, city }));
        }
      } catch (err) {
        setState((s) => ({
          ...s,
          status: 'error',
          error: err instanceof Error ? err.message : 'Error al cargar ideas',
        }));
      }
    },
    [today]
  );

  // ── Main load (detect city → fetch ideas) ────────────────────────────────
  const load = useCallback(async () => {
    if (overrideCity) {
      // Profile-supplied city — skip GPS
      await fetchIdeasForCity(overrideCity);
      return;
    }

    setState((s) => ({ ...s, status: 'detecting-city' }));

    const { city, changed } = await detectAndUpdateCity();

    if (!city) {
      setState((s) => ({ ...s, status: 'empty', city: null }));
      return;
    }

    if (changed) {
      toast.info(`Mostrando ideas para ${city} 📍`);
    }

    await fetchIdeasForCity(city);
  }, [overrideCity, fetchIdeasForCity]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrideCity]); // re-run if profile city changes

  // ── Feedback submission ──────────────────────────────────────────────────
  const submitFeedback = useCallback(
    async (userId: string, feedbackText: string) => {
      const city = state.city;
      if (!city) return;

      setState((s) => ({ ...s, status: 'personalizing', error: null }));
      try {
        const personalized = await feedbackUseCaseRef.current.execute({
          userId,
          city,
          date: today,
          feedbackText,
        });
        setState((s) => ({
          ...s,
          status: 'personalized',
          ideas: personalized,
        }));
        toast.success('¡Sugerencias personalizadas listas! 🎉');
      } catch (err) {
        setState((s) => ({
          ...s,
          status: 'error',
          error:
            err instanceof Error
              ? err.message
              : 'Error al personalizar ideas',
        }));
      }
    },
    [state.city, today]
  );

  return {
    ...state,
    today,
    submitFeedback,
    reload: load,
  };
}
