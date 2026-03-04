/**
 * GetDateIdeasUseCase tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetDateIdeasUseCase } from '../GetDateIdeasUseCase';
import { IDateIdeasRepository } from '../../../../domain/repositories/IDateIdeasRepository';
import { DateIdeas } from '../../../../domain/entities/DateIdea';

// Mock Supabase client used inside the use-case for caching
vi.mock('../../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

// Mock the OpenAI service
vi.mock('../../../../services/dateIdeasService', () => ({
  generateDateIdeasForCity: vi.fn(),
}));

import { generateDateIdeasForCity } from '../../../../services/dateIdeasService';

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
  });

  it('returns cached ideas when available', async () => {
    const repo = makeRepo({
      getIdeasForCity: vi.fn().mockResolvedValue(MOCK_IDEAS),
    });
    const uc = new GetDateIdeasUseCase(repo);
    const result = await uc.execute({ city: 'Bogotá', date: '2026-03-04' });

    expect(result).toEqual(MOCK_IDEAS);
    expect(repo.getIdeasForCity).toHaveBeenCalledWith('Bogotá', '2026-03-04');
    expect(generateDateIdeasForCity).not.toHaveBeenCalled();
  });

  it('generates ideas via OpenAI when cache is empty', async () => {
    const repo = makeRepo({ getIdeasForCity: vi.fn().mockResolvedValue(null) });
    vi.mocked(generateDateIdeasForCity).mockResolvedValue({
      ideas: MOCK_IDEAS.ideas,
      cityNote: MOCK_IDEAS.cityNote,
    });

    const uc = new GetDateIdeasUseCase(repo);
    const result = await uc.execute({ city: 'Bogotá', date: '2026-03-04' });

    expect(generateDateIdeasForCity).toHaveBeenCalledWith('Bogotá', '2026-03-04');
    expect(result).not.toBeNull();
    expect(result?.city).toBe('Bogotá');
    expect(result?.ideas).toEqual(MOCK_IDEAS.ideas);
  });

  it('returns null when city is empty', async () => {
    const repo = makeRepo();
    const uc = new GetDateIdeasUseCase(repo);
    const result = await uc.execute({ city: '', date: '2026-03-04' });

    expect(result).toBeNull();
    expect(repo.getIdeasForCity).not.toHaveBeenCalled();
  });

  it('returns null when generation fails', async () => {
    const repo = makeRepo({ getIdeasForCity: vi.fn().mockResolvedValue(null) });
    vi.mocked(generateDateIdeasForCity).mockRejectedValue(new Error('API error'));

    const uc = new GetDateIdeasUseCase(repo);
    const result = await uc.execute({ city: 'Cali', date: '2026-03-04' });

    expect(result).toBeNull();
  });
});
