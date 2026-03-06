/**
 * SupabaseDailyQuestionService
 * Application service that orchestrates daily question operations.
 */

import { IDailyQuestionService, DailyQuestionState } from '../../application/services/IDailyQuestionService';
import { SupabaseDailyQuestionRepository } from '../repositories/SupabaseDailyQuestionRepository';
import { GetDailyQuestionUseCase } from '../../domain/usecases/GetDailyQuestionUseCase';
import { SubmitDailyAnswerUseCase } from '../../domain/usecases/SubmitDailyAnswerUseCase';

export class SupabaseDailyQuestionService implements IDailyQuestionService {
  private readonly repo: SupabaseDailyQuestionRepository;
  private readonly getQuestion: GetDailyQuestionUseCase;
  private readonly submitAnswerUseCase: SubmitDailyAnswerUseCase;

  constructor() {
    this.repo = new SupabaseDailyQuestionRepository();
    this.getQuestion = new GetDailyQuestionUseCase(this.repo);
    this.submitAnswerUseCase = new SubmitDailyAnswerUseCase(this.repo);
  }

  async loadTodayData(coupleId: string): Promise<DailyQuestionState> {
    try {
      const questionResult = await this.getQuestion.execute(coupleId);

      if (!questionResult.isOk()) {
        return {
          question: null,
          myAnswer: null,
          partnerAnswer: null,
          bothAnswered: false,
          isLoading: false,
          error: questionResult.getError()?.message || 'Failed to load question',
        };
      }

      const question = questionResult.getValue()!;
      const today = question.date;

      const answersResult = await this.repo.getTodayAnswers(coupleId, today);
      const answers = answersResult.isOk() ? (answersResult.getValue() ?? []) : [];

      return {
        question,
        myAnswer: answers[0] ?? null,
        partnerAnswer: answers[1] ?? null,
        bothAnswered: answers.length >= 2,
        isLoading: false,
        error: null,
      };
    } catch (err) {
      return {
        question: null,
        myAnswer: null,
        partnerAnswer: null,
        bothAnswered: false,
        isLoading: false,
        error: (err as Error).message,
      };
    }
  }

  async submitAnswer(
    coupleId: string,
    questionId: string,
    userId: string,
    answer: string
  ): Promise<{ ok: boolean; error?: string }> {
    const result = await this.submitAnswerUseCase.execute(coupleId, questionId, userId, answer);

    if (result.isOk()) {
      return { ok: true };
    }
    return { ok: false, error: result.getError()?.message };
  }
}
