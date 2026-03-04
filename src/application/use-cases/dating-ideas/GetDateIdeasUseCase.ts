/**
 * GetDateIdeasUseCase
 * Retrieves date ideas for the user's city for today.
 * Falls back to generating via OpenAI when not yet cached in the DB.
 */

import { DateIdeas } from '../../../domain/entities/DateIdea';
import { IDateIdeasRepository } from '../../../domain/repositories/IDateIdeasRepository';
import { generateDateIdeasForCity } from '../../../services/dateIdeasService';
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

    // 2. Generate on-the-fly via OpenAI and store in DB
    try {
      const generated = await generateDateIdeasForCity(city, date);

      // Upsert into date_ideas (fire-and-forget errors for UX)
      supabase
        .from('date_ideas')
        .upsert(
          {
            city,
            date,
            ideas: generated,
            generated_at: new Date().toISOString(),
          },
          { onConflict: 'city,date' }
        )
        .then(({ error }) => {
          if (error) console.warn('Could not cache date ideas:', error.message);
        });

      return {
        id: `generated-${city}-${date}`,
        city,
        date,
        ideas: generated.ideas,
        cityNote: generated.cityNote,
        generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error('GetDateIdeasUseCase: failed to generate ideas', err);
      return null;
    }
  }
}
