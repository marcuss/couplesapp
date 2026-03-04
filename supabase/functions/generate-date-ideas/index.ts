/**
 * Edge Function: generate-date-ideas
 * Cron: 0 6 * * * (6 AM UTC = 1 AM COT)
 *
 * For each distinct city in profiles, generates 8-10 date ideas via
 * OpenAI Structured Outputs and upserts them into date_ideas.
 *
 * Deploy:
 *   supabase functions deploy generate-date-ideas
 *
 * Manual trigger:
 *   supabase functions invoke generate-date-ideas
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4';
import { zodResponseFormat } from 'https://esm.sh/openai@4/helpers/zod';
import { z } from 'https://esm.sh/zod@3';

// ─── Schema (identical to frontend) ─────────────────────────────────────────

const DateIdeaSchema = z.object({
  ideas: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        category: z.enum([
          'restaurant', 'concert', 'outdoor', 'cultural', 'sport',
          'entertainment', 'romantic', 'adventure', 'art', 'other',
        ]),
        description: z.string().max(200),
        estimatedCost: z.enum(['free', 'low', 'medium', 'high']),
        emoji: z.string(),
        timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night', 'any']),
        indoorOutdoor: z.enum(['indoor', 'outdoor', 'both']),
        tags: z.array(z.string()).max(5),
      })
    )
    .min(5)
    .max(10),
  cityNote: z.string().max(150),
});

// ─── Handler ─────────────────────────────────────────────────────────────────

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // 1. Distinct active cities
  const { data: cityRows, error: cityError } = await supabase
    .from('profiles')
    .select('city')
    .not('city', 'is', null)
    .neq('city', '');

  if (cityError) {
    console.error('Failed to fetch cities:', cityError.message);
    return new Response(JSON.stringify({ error: cityError.message }), { status: 500 });
  }

  const distinctCities = [
    ...new Set((cityRows ?? []).map((r) => r.city).filter(Boolean) as string[]),
  ];

  console.log(
    `[generate-date-ideas] ${today} — ${distinctCities.length} cities: ${distinctCities.join(', ')}`
  );

  const results: Array<{ city: string; status: string; count?: number; error?: string }> = [];

  for (const city of distinctCities) {
    // 2. Skip if already generated today
    const { data: existing } = await supabase
      .from('date_ideas')
      .select('id')
      .eq('city', city)
      .eq('date', today)
      .maybeSingle();

    if (existing) {
      console.log(`[skip] ${city} — already generated`);
      results.push({ city, status: 'skipped' });
      continue;
    }

    // 3. Generate via OpenAI Structured Outputs
    try {
      const dayOfWeek = new Date(today + 'T12:00:00').toLocaleDateString('es', {
        weekday: 'long',
      });
      const month = new Date(today + 'T12:00:00').toLocaleDateString('es', {
        month: 'long',
      });

      const response = await openai.beta.chat.completions.parse({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Eres un experto local en ${city} que sugiere ideas de citas para parejas.`,
          },
          {
            role: 'user',
            content:
              `Genera 8-10 ideas de citas para parejas en ${city} para el ` +
              `${dayOfWeek} ${today} (${month}). ` +
              `Variedad: romántico, aventurero, cultural, gastronómico.`,
          },
        ],
        response_format: zodResponseFormat(DateIdeaSchema, 'date_ideas'),
        temperature: 0.8,
        max_tokens: 2000,
      });

      const parsed = response.choices[0].message.parsed;
      if (!parsed) throw new Error('No parsed response from OpenAI');

      // 4. Upsert into date_ideas
      const { error: upsertError } = await supabase.from('date_ideas').upsert(
        {
          city,
          date: today,
          ideas: parsed,
          generated_at: new Date().toISOString(),
        },
        { onConflict: 'city,date' }
      );

      if (upsertError) throw upsertError;

      console.log(`[ok] ${city}: ${parsed.ideas.length} ideas`);
      results.push({ city, status: 'ok', count: parsed.ideas.length });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[error] ${city}: ${msg}`);
      results.push({ city, status: 'error', error: msg });
    }
  }

  return new Response(JSON.stringify({ date: today, results }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
