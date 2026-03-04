/**
 * SubmitDateIdeasFeedbackUseCase tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubmitDateIdeasFeedbackUseCase } from '../SubmitDateIdeasFeedbackUseCase';
import { IDateIdeasRepository } from '../../../../domain/repositories/IDateIdeasRepository';
import { DateIdeas } from '../../../../domain/entities/DateIdea';

const PERSONALIZED: DateIdeas = {
  id: 'personalized-user1-2026-03-04',
  city: 'Medellín',
  date: '2026-03-04',
  ideas: [
    {
      id: 'p-1',
      title: 'Senderismo en el cerro',
      category: 'outdoor',
      description: 'Vista increíble de la ciudad',
      estimatedCost: 'free',
      emoji: '🥾',
      timeOfDay: 'morning',
      indoorOutdoor: 'outdoor',
      tags: ['naturaleza', 'deporte'],
    },
  ],
  cityNote: 'Medellín tiene rutas hermosas',
  generatedAt: '2026-03-04T10:00:00Z',
};

function makeRepo(): IDateIdeasRepository {
  return {
    getIdeasForCity: vi.fn().mockResolvedValue(null),
    saveFeedback: vi.fn().mockResolvedValue(undefined),
    getPersonalizedIdeas: vi.fn().mockResolvedValue(PERSONALIZED),
  };
}

describe('SubmitDateIdeasFeedbackUseCase', () => {
  beforeEach(() => vi.clearAllMocks());

  it('delegates to repo.getPersonalizedIdeas with correct args', async () => {
    const repo = makeRepo();
    const uc = new SubmitDateIdeasFeedbackUseCase(repo);

    const result = await uc.execute({
      userId: 'user-1',
      city: 'Medellín',
      date: '2026-03-04',
      feedbackText: 'Quiero actividades al aire libre',
    });

    expect(repo.getPersonalizedIdeas).toHaveBeenCalledWith(
      'user-1',
      'Medellín',
      '2026-03-04',
      'Quiero actividades al aire libre'
    );
    expect(result).toEqual(PERSONALIZED);
  });

  it('throws when feedbackText is empty', async () => {
    const repo = makeRepo();
    const uc = new SubmitDateIdeasFeedbackUseCase(repo);

    await expect(
      uc.execute({ userId: 'u1', city: 'Cali', date: '2026-03-04', feedbackText: '' })
    ).rejects.toThrow('Feedback text cannot be empty');
    expect(repo.getPersonalizedIdeas).not.toHaveBeenCalled();
  });

  it('throws when feedbackText is only whitespace', async () => {
    const repo = makeRepo();
    const uc = new SubmitDateIdeasFeedbackUseCase(repo);

    await expect(
      uc.execute({ userId: 'u1', city: 'Cali', date: '2026-03-04', feedbackText: '   ' })
    ).rejects.toThrow();
  });

  it('propagates repo errors', async () => {
    const repo = makeRepo();
    vi.mocked(repo.getPersonalizedIdeas).mockRejectedValue(new Error('Network error'));
    const uc = new SubmitDateIdeasFeedbackUseCase(repo);

    await expect(
      uc.execute({ userId: 'u1', city: 'Cali', date: '2026-03-04', feedbackText: 'algo' })
    ).rejects.toThrow('Network error');
  });
});
