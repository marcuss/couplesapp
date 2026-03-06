/**
 * GetDailyQuestionUseCase
 * Retrieves today's daily question for a couple.
 * If none assigned yet, triggers auto-assignment via repository.
 */

import { AsyncResult } from '../../shared/utils/Result';
import { DomainError } from '../errors/DomainError';
import { IDailyQuestionRepository, DailyQuestion } from '../repositories/IDailyQuestionRepository';

export class GetDailyQuestionUseCase {
  constructor(private readonly repo: IDailyQuestionRepository) {}

  async execute(coupleId: string): AsyncResult<DailyQuestion, DomainError> {
    return this.repo.getDailyQuestion(coupleId);
  }
}
