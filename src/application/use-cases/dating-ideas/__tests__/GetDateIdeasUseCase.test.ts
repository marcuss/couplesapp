/**
 * GetDateIdeasUseCase tests
 *
 * The fallback now calls the Edge Function `generate-date-ideas` instead of
 * calling OpenAI directly (VITE_OPENAI_API_KEY is not exposed in the frontend).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetDateIdeasUseCase } from '../GetDateIdeasUseCase';
import { IDateIdeasRepository } from '../../../../domain/repositories/IDateIdeasRepository';
import { DateIdeas } from '../../../../domain/entities/DateIdea';

// Mock Supabase client — includes functions.invoke for the edge function fallback
// NOTE: must use inline vi.fn() here because vi.mock is hoisted above variable declarations
vi.mock('../../../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

// Import supabase AFTER mocking so we get the mocked version
import { supabase } from '../../../../lib/supabase';

const MOCK_IDEAS: DateIdeas = {
  id: 'di-1',
  city: 'Bogotá',
  date: '2026-03-04',
  ideas: [
    {
      id: 'idea-1',
      title: 'Visita al museo',
      category: 'cultural',
      description: 'El mejor museo de arte moderno',
      estimatedCost: 'low',
      emoji: '🎨',
      timeOfDay: 'afternoon',
      indoorOutdoor: 'indoor',
      tags: ['arte', 'cultura'],
    },
  ],
  cityNote: 'Bogotá tiene mucho que ofrecer',
  generatedAt: '2026-03-04T06:00:00Z',
};

function makeRepo(overrides?: Partial<IDateIdeasRepository>): IDateIdeasRepository {
  return {
    getIdeasForCity: vi.fn().mockResolvedValue(null),
    saveFeedback: vi.fn().mockResolvedValue(undefined),
    getPersonalizedIdeas: vi.fn().mockResolvedValue(MOCK_IDEAS),
    ...overrides,
  };
}

describe('GetDateIdeasUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset invoke to default success
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: null, error: null });
  });

  it('returns cached ideas when available', async () => {
    const repo = makeRepo({
      getIdeasForCity: vi.fn().mockResolvedValue(MOCK_IDEAS),
    });
    const uc = new GetDateIdeasUseCase(repo);
    const result = await uc.execute({ city: 'Bogotá', date: '2026-03-04' });

    expect(result).toEqual(MOCK_IDEAS);
    expect(repo.getIdeasForCity).toHaveBeenCalledWith('Bogotá', '2026-03-04');
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });

  it('calls edge function and re-fetches when cache is empty', async () => {
    // First call returns null (cache miss), second returns the generated ideas
    const getIdeasForCity = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(MOCK_IDEAS);
    const repo = makeRepo({ getIdeasForCity });

    const uc = new GetDateIdeasUseCase(repo);
    const result = await uc.execute({ city: 'Bogotá', date: '2026-03-04' });

    expect(supabase.functions.invoke).toHaveBeenCalledWith('generate-date-ideas', {
      body: { cities: ['Bogotá'] },
    });
    expect(getIdeasForCity).toHaveBeenCalledTimes(2);
    expect(result).toEqual(MOCK_IDEAS);
  });

  it('returns null when city is empty', async () => {
    const repo = makeRepo();
    const uc = new GetDateIdeasUseCase(repo);
    const result = await uc.execute({ city: '', date: '2026-03-04' });

    expect(result).toBeNull();
    expect(repo.getIdeasForCity).not.toHaveBeenCalled();
  });

  it('returns null when edge function returns an error', async () => {
    const repo = makeRepo({ getIdeasForCity: vi.fn().mockResolvedValue(null) });
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: new Error('Function error'),
    });

    const uc = new GetDateIdeasUseCase(repo);
    const result = await uc.execute({ city: 'Cali', date: '2026-03-04' });

    expect(result).toBeNull();
  });

  it('returns null when edge function throws', async () => {
    const repo = makeRepo({ getIdeasForCity: vi.fn().mockResolvedValue(null) });
    vi.mocked(supabase.functions.invoke).mockRejectedValue(new Error('Network error'));

    const uc = new GetDateIdeasUseCase(repo);
    const result = await uc.execute({ city: 'Cali', date: '2026-03-04' });

    expect(result).toBeNull();
  });
});
