/**
 * GetDateIdeasUseCase
 * Retrieves date ideas for the user's city for today.
 * Falls back to calling the Edge Function when not yet cached in the DB.
 *
 * Note: The client-side OpenAI fallback was removed because VITE_OPENAI_API_KEY
 * is intentionally not exposed in the frontend for security reasons.
 * The Edge Function `generate-date-ideas` handles generation server-side.
 */

import { DateIdeas } from '../../../domain/entities/DateIdea';
import { IDateIdeasRepository } from '../../../domain/repositories/IDateIdeasRepository';
import { supabase } from '../../../lib/supabase';

export interface GetDateIdeasInput {
  city: string;
  date: string; // YYYY-MM-DD
}

export class GetDateIdeasUseCase {
  constructor(private readonly repo: IDateIdeasRepository) {}

  async execute({ city, date }: GetDateIdeasInput): Promise<DateIdeas | null> {
    if (!city) return null;

    // 1. Try to load from cache (Supabase)
    const cached = await this.repo.getIdeasForCity(city, date);
    if (cached) return cached;

    // 2. Not in DB → trigger the Edge Function to generate ideas server-side.
    //    The Edge Function has the OpenAI key and stores results in date_ideas.
    try {
      const { error: fnError } = await supabase.functions.invoke('generate-date-ideas', {
        body: { cities: [city] },
      });

      if (fnError) {
        console.error('GetDateIdeasUseCase: edge function error', fnError);
        return null;
      }

      // 3. Re-fetch now that the Edge Function has populated the DB
      const generated = await this.repo.getIdeasForCity(city, date);
      return generated;
    } catch (err) {
      console.error('GetDateIdeasUseCase: failed to generate ideas via edge function', err);
      return null;
    }
  }
}
