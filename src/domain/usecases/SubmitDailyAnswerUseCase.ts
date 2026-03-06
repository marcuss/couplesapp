/**
 * SubmitDailyAnswerUseCase
 * Submits a user's answer to today's daily question.
 * Validates the answer is non-empty before persisting.
 */

import { AsyncResult, Result } from '../../shared/utils/Result';
import { DomainError, ValidationError } from '../errors/DomainError';
import { IDailyQuestionRepository, DailyAnswer } from '../repositories/IDailyQuestionRepository';

export class SubmitDailyAnswerUseCase {
  constructor(private readonly repo: IDailyQuestionRepository) {}

  async execute(
    coupleId: string,
    questionId: string,
    userId: string,
    answer: string
  ): AsyncResult<DailyAnswer, DomainError> {
    const trimmed = answer.trim();
    if (!trimmed) {
      return Result.fail(new ValidationError('Answer cannot be empty'));
    }
    return this.repo.submitAnswer(coupleId, questionId, userId, trimmed);
  }
}
