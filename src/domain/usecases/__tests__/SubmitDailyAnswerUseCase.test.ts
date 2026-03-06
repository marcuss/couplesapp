/**
 * SubmitDailyAnswerUseCase Tests (TDD)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Result } from '../../../shared/utils/Result';
import { DatabaseError } from '../../errors/DomainError';
import { IDailyQuestionRepository, DailyAnswer } from '../../repositories/IDailyQuestionRepository';
import { SubmitDailyAnswerUseCase } from '../SubmitDailyAnswerUseCase';

const MOCK_ANSWER: DailyAnswer = {
  id: 'ans-uuid-1',
  coupleId: 'couple-1',
  questionId: 'q-uuid-1',
  userId: 'user-1',
  answer: 'I feel heard when you put your phone down.',
  date: '2026-03-05',
  answeredAt: '2026-03-05T10:00:00Z',
};

function createMockRepo(overrides?: Partial<IDailyQuestionRepository>): IDailyQuestionRepository {
  return {
    getDailyQuestion: vi.fn().mockResolvedValue(Result.ok({})),
    submitAnswer: vi.fn().mockResolvedValue(Result.ok(MOCK_ANSWER)),
    getTodayAnswers: vi.fn().mockResolvedValue(Result.ok([])),
    ...overrides,
  };
}

describe('SubmitDailyAnswerUseCase', () => {
  let repo: IDailyQuestionRepository;
  let useCase: SubmitDailyAnswerUseCase;

  beforeEach(() => {
    repo = createMockRepo();
    useCase = new SubmitDailyAnswerUseCase(repo);
  });

  it('submits a valid answer successfully', async () => {
    const result = await useCase.execute('couple-1', 'q-uuid-1', 'user-1', 'My honest answer.');

    expect(result.isOk()).toBe(true);
    expect(result.getValue()).toEqual(MOCK_ANSWER);
    expect(repo.submitAnswer).toHaveBeenCalledWith(
      'couple-1', 'q-uuid-1', 'user-1', 'My honest answer.'
    );
  });

  it('trims whitespace from the answer before persisting', async () => {
    await useCase.execute('couple-1', 'q-uuid-1', 'user-1', '  My answer with spaces.  ');

    expect(repo.submitAnswer).toHaveBeenCalledWith(
      'couple-1', 'q-uuid-1', 'user-1', 'My answer with spaces.'
    );
  });

  it('rejects an empty answer with a ValidationError', async () => {
    const result = await useCase.execute('couple-1', 'q-uuid-1', 'user-1', '');

    expect(result.isOk()).toBe(false);
    expect(result.getError()?.message).toBe('Answer cannot be empty');
    expect(repo.submitAnswer).not.toHaveBeenCalled();
  });

  it('rejects a whitespace-only answer', async () => {
    const result = await useCase.execute('couple-1', 'q-uuid-1', 'user-1', '   ');

    expect(result.isOk()).toBe(false);
    expect(result.getError()?.message).toBe('Answer cannot be empty');
    expect(repo.submitAnswer).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    const errorRepo = createMockRepo({
      submitAnswer: vi.fn().mockResolvedValue(
        Result.fail(new DatabaseError('Unique constraint violation'))
      ),
    });
    const errorUseCase = new SubmitDailyAnswerUseCase(errorRepo);

    const result = await errorUseCase.execute('couple-1', 'q-uuid-1', 'user-1', 'My answer');

    expect(result.isOk()).toBe(false);
    expect(result.getError()).toBeInstanceOf(DatabaseError);
  });
});
