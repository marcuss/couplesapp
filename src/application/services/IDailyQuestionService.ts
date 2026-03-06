/**
 * IDailyQuestionService - Application Service Interface
 * Orchestrates daily question and answer operations for the presentation layer.
 */

import { DailyQuestion, DailyAnswer } from '../../domain/repositories/IDailyQuestionRepository';

export interface DailyQuestionState {
  question: DailyQuestion | null;
  myAnswer: DailyAnswer | null;
  partnerAnswer: DailyAnswer | null;
  bothAnswered: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface IDailyQuestionService {
  /**
   * Load today's question and answers for a couple.
   */
  loadTodayData(coupleId: string): Promise<DailyQuestionState>;

  /**
   * Submit the current user's answer.
   */
  submitAnswer(
    coupleId: string,
    questionId: string,
    userId: string,
    answer: string
  ): Promise<{ ok: boolean; error?: string }>;
}
