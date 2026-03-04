/**
 * SupabaseDateIdeasRepository tests (mocked Supabase)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock the OpenAI service ──────────────────────────────────────────────────
vi.mock('../../../services/dateIdeasService', () => ({
  generateDateIdeasForCity: vi.fn(),
}));

// ── Mock Supabase with vi.hoisted to avoid hoisting issues ───────────────────
const { mockFrom } = vi.hoisted(() => {
  const mockFrom = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    insert: vi.fn().mockResolvedValue({ error: null }),
    update: vi.fn().mockReturnThis(),
  });

  return { mockFrom };
});

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
    get from() { return mockFrom; },
  },
}));

import { SupabaseDateIdeasRepository } from '../SupabaseDateIdeasRepository';
import { generateDateIdeasForCity } from '../../../services/dateIdeasService';

const MOCK_ROW = {
  id: 'row-1',
  city: 'Bogotá',
  date: '2026-03-04',
  ideas: {
    ideas: [
      {
        id: 'i1',
        title: 'Cena en el parque',
        category: 'outdoor',
        description: 'Picnic bajo las estrellas',
        estimatedCost: 'low',
        emoji: '🌟',
        timeOfDay: 'night',
        indoorOutdoor: 'outdoor',
        tags: ['romántico'],
      },
    ],
    cityNote: 'Bogotá cool',
  },
  generated_at: '2026-03-04T06:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SupabaseDateIdeasRepository', () => {
  describe('getIdeasForCity', () => {
    it('returns mapped DateIdeas when row exists', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: MOCK_ROW, error: null }),
      });

      const repo = new SupabaseDateIdeasRepository();
      const result = await repo.getIdeasForCity('Bogotá', '2026-03-04');

      expect(result).not.toBeNull();
      expect(result?.city).toBe('Bogotá');
      expect(result?.ideas).toHaveLength(1);
      expect(result?.ideas[0].title).toBe('Cena en el parque');
      expect(result?.cityNote).toBe('Bogotá cool');
    });

    it('returns null when no row found', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      const repo = new SupabaseDateIdeasRepository();
      const result = await repo.getIdeasForCity('Nowhere', '2026-03-04');
      expect(result).toBeNull();
    });

    it('returns null on query error', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      });

      const repo = new SupabaseDateIdeasRepository();
      const result = await repo.getIdeasForCity('Bogotá', '2026-03-04');
      expect(result).toBeNull();
    });
  });

  describe('saveFeedback', () => {
    it('inserts feedback row', async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      mockFrom.mockReturnValue({ insert: insertMock });

      const repo = new SupabaseDateIdeasRepository();
      await expect(
        repo.saveFeedback('user-1', 'Medellín', '2026-03-04', 'más outdoor')
      ).resolves.toBeUndefined();

      expect(insertMock).toHaveBeenCalledWith({
        user_id: 'user-1',
        city: 'Medellín',
        date: '2026-03-04',
        feedback_text: 'más outdoor',
      });
    });

    it('throws on insert error', async () => {
      mockFrom.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: { message: 'Insert failed' } }),
      });

      const repo = new SupabaseDateIdeasRepository();
      await expect(
        repo.saveFeedback('u', 'city', 'date', 'fb')
      ).rejects.toThrow('Insert failed');
    });
  });

  describe('getPersonalizedIdeas', () => {
    it('calls generateDateIdeasForCity with feedback and returns result', async () => {
      vi.mocked(generateDateIdeasForCity).mockResolvedValue({
        ideas: [MOCK_ROW.ideas.ideas[0]],
        cityNote: 'Personalizado',
      });

      mockFrom.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

      const repo = new SupabaseDateIdeasRepository();
      const result = await repo.getPersonalizedIdeas(
        'user-1', 'Medellín', '2026-03-04', 'outdoor'
      );

      expect(generateDateIdeasForCity).toHaveBeenCalledWith('Medellín', '2026-03-04', 'outdoor');
      expect(result.city).toBe('Medellín');
      expect(result.cityNote).toBe('Personalizado');
    });
  });
});
