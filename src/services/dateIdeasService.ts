/**
 * Date Ideas Service
 * Calls OpenAI with Structured Outputs to generate date ideas for a city.
 * Uses zodResponseFormat for strict schema compliance.
 */

import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

// ─── Zod Schema ──────────────────────────────────────────────────────────────

export const DateIdeaItemSchema = z.object({
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
});

export const DateIdeaSchema = z.object({
  ideas: z.array(DateIdeaItemSchema).min(5).max(10),
  cityNote: z.string().max(150),
});

export type DateIdeasResponse = z.infer<typeof DateIdeaSchema>;

// ─── Client ──────────────────────────────────────────────────────────────────

function getClient(): OpenAI {
  // Vite env vars (client-side) or Node env vars (edge function / server)
  const apiKey =
    (typeof import.meta !== 'undefined' && (import.meta as Record<string, unknown>).env
      ? (import.meta as { env: Record<string, string> }).env.VITE_OPENAI_API_KEY
      : undefined) ||
    (typeof process !== 'undefined' ? process.env.OPENAI_API_KEY : undefined);

  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  return new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
}

// ─── Main function ───────────────────────────────────────────────────────────

export async function generateDateIdeasForCity(
  city: string,
  date: string, // YYYY-MM-DD
  feedback?: string
): Promise<DateIdeasResponse> {
  const client = getClient();

  const today = new Date(date + 'T12:00:00'); // noon to avoid TZ issues
  const dayOfWeek = today.toLocaleDateString('es', { weekday: 'long' });
  const month = today.toLocaleDateString('es', { month: 'long' });

  const systemPrompt =
    `Eres un experto local en ${city} que sugiere ideas de citas para parejas. ` +
    `Conoces los mejores restaurantes, eventos culturales, actividades al aire libre y ` +
    `experiencias únicas de la ciudad. Siempre respondes con ideas específicas, realistas ` +
    `y apropiadas para la fecha y temporada. ` +
    `Las ideas deben ser variadas: desde económicas hasta premium, íntimas hasta aventureras.`;

  const userPrompt = feedback
    ? `Genera 5-8 ideas de citas para una pareja en ${city} para el ${dayOfWeek} ${date} (${month}). ` +
      `El usuario indicó que quiere mejorar las sugerencias: "${feedback}". ` +
      `Ajusta las ideas según este feedback específico.`
    : `Genera 8-10 ideas de citas para una pareja en ${city} para el ${dayOfWeek} ${date} (${month}). ` +
      `Incluye variedad: romántico, aventurero, cultural, gastronómico, al aire libre. ` +
      `Considera eventos típicos de ${month} en esta ciudad.`;

  const response = await client.beta.chat.completions.parse({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: zodResponseFormat(DateIdeaSchema, 'date_ideas'),
    temperature: 0.8,
    max_tokens: 2000,
  });

  const parsed = response.choices[0].message.parsed;
  if (!parsed) throw new Error('Failed to parse OpenAI response');

  return parsed;
}
