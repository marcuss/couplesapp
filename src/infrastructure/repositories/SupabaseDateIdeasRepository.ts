/**
 * SupabaseDateIdeasRepository
 * Infrastructure adapter for date_ideas and date_ideas_feedback tables.
 */

import { supabase } from '../../lib/supabase';
import { DateIdeas } from '../../domain/entities/DateIdea';
import { IDateIdeasRepository } from '../../domain/repositories/IDateIdeasRepository';
import { generateDateIdeasForCity } from '../../services/dateIdeasService';

export class SupabaseDateIdeasRepository implements IDateIdeasRepository {
  async getIdeasForCity(city: string, date: string): Promise<DateIdeas | null> {
    const { data, error } = await supabase
      .from('date_ideas')
      .select('*')
      .eq('city', city)
      .eq('date', date)
      .maybeSingle();

    if (error) {
      console.error('SupabaseDateIdeasRepository.getIdeasForCity error:', error);
      return null;
    }

    if (!data) return null;

    return this.mapRow(data);
  }

  async saveFeedback(
    userId: string,
    city: string,
    date: string,
    feedback: string
  ): Promise<void> {
    const { error } = await supabase.from('date_ideas_feedback').insert({
      user_id: userId,
      city,
      date,
      feedback_text: feedback,
    });

    if (error) {
      throw new Error(`Failed to save feedback: ${error.message}`);
    }
  }

  async getPersonalizedIdeas(
    userId: string,
    city: string,
    date: string,
    feedback: string
  ): Promise<DateIdeas> {
    // Generate personalized ideas via OpenAI with the user's feedback
    const generated = await generateDateIdeasForCity(city, date, feedback);

    // Persist the personalized ideas alongside the feedback
    const { error } = await supabase
      .from('date_ideas_feedback')
      .insert({
        user_id: userId,
        city,
        date,
        feedback_text: feedback,
        personalized_ideas: generated,
      });

    if (error) {
      console.warn('Failed to persist personalized ideas feedback:', error.message);
    }

    return {
      id: `personalized-${userId}-${date}`,
      city,
      date,
      ideas: generated.ideas,
      cityNote: generated.cityNote,
      generatedAt: new Date().toISOString(),
    };
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private mapRow(row: Record<string, unknown>): DateIdeas {
    const raw = row.ideas as { ideas?: unknown[]; cityNote?: string } | null;
    return {
      id: row.id as string,
      city: row.city as string,
      date: row.date as string,
      ideas: (raw?.ideas ?? []) as DateIdeas['ideas'],
      cityNote: raw?.cityNote ?? '',
      generatedAt: row.generated_at as string,
    };
  }
}
