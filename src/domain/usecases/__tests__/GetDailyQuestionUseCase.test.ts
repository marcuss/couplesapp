/**
 * GetDailyQuestionUseCase Tests (TDD)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Result } from '../../../shared/utils/Result';
import { DatabaseError } from '../../errors/DomainError';
import { IDailyQuestionRepository, DailyQuestion } from '../../repositories/IDailyQuestionRepository';
import { GetDailyQuestionUseCase } from '../GetDailyQuestionUseCase';

const MOCK_QUESTION: DailyQuestion = {
  questionId: 'q-uuid-1',
  category: 'communication',
  difficulty: 1,
  translations: {
    en: "What's one thing I do that makes you feel truly heard?",
    es: "¿Qué es algo que hago que te hace sentir verdaderamente escuchado/a?",
  },
  date: '2026-03-05',
};

function createMockRepo(overrides?: Partial<IDailyQuestionRepository>): IDailyQuestionRepository {
  return {
    getDailyQuestion: vi.fn().mockResolvedValue(Result.ok(MOCK_QUESTION)),
    submitAnswer: vi.fn().mockResolvedValue(Result.ok({})),
    getTodayAnswers: vi.fn().mockResolvedValue(Result.ok([])),
    ...overrides,
  };
}

describe('GetDailyQuestionUseCase', () => {
  let repo: IDailyQuestionRepository;
  let useCase: GetDailyQuestionUseCase;

  beforeEach(() => {
    repo = createMockRepo();
    useCase = new GetDailyQuestionUseCase(repo);
  });

  it('returns the daily question for a couple', async () => {
    const result = await useCase.execute('couple-1');

    expect(result.isOk()).toBe(true);
    expect(result.getValue()).toEqual(MOCK_QUESTION);
    expect(repo.getDailyQuestion).toHaveBeenCalledWith('couple-1');
  });

  it('delegates the call to the repository', async () => {
    await useCase.execute('couple-abc');
    expect(repo.getDailyQuestion).toHaveBeenCalledTimes(1);
    expect(repo.getDailyQuestion).toHaveBeenCalledWith('couple-abc');
  });

  it('propagates repository errors', async () => {
    const errorRepo = createMockRepo({
      getDailyQuestion: vi.fn().mockResolvedValue(
        Result.fail(new DatabaseError('Connection failed'))
      ),
    });
    const errorUseCase = new GetDailyQuestionUseCase(errorRepo);

    const result = await errorUseCase.execute('couple-1');

    expect(result.isOk()).toBe(false);
    expect(result.getError()).toBeInstanceOf(DatabaseError);
    expect(result.getError()!.message).toBe('Connection failed');
  });

  it('returns question with all required fields', async () => {
    const result = await useCase.execute('couple-1');
    const q = result.getValue()!;

    expect(q).toHaveProperty('questionId');
    expect(q).toHaveProperty('category');
    expect(q).toHaveProperty('difficulty');
    expect(q).toHaveProperty('translations');
    expect(q).toHaveProperty('date');
    expect(q.translations).toHaveProperty('en');
  });
});
