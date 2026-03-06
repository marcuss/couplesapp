/**
 * IDailyQuestionRepository - Port for daily question persistence
 * Defines the contract for daily question data operations.
 */

import { AsyncResult } from '../../shared/utils/Result';
import { DomainError } from '../errors/DomainError';

export interface DailyQuestion {
  questionId: string;
  category: string;
  difficulty: number;
  translations: Record<string, string>;
  date: string;
}

export interface DailyAnswer {
  id: string;
  coupleId: string;
  questionId: string;
  userId: string;
  answer: string;
  date: string;
  answeredAt: string;
}

export interface IDailyQuestionRepository {
  /**
   * Get or create today's question assignment for a couple.
   * Uses the get_daily_question Supabase function.
   */
  getDailyQuestion(coupleId: string): AsyncResult<DailyQuestion, DomainError>;

  /**
   * Submit a user's answer to today's daily question.
   */
  submitAnswer(
    coupleId: string,
    questionId: string,
    userId: string,
    answer: string
  ): AsyncResult<DailyAnswer, DomainError>;

  /**
   * Get today's answers for a couple.
   * RLS on the DB handles the asymmetric reveal:
   * - Own answer always visible
   * - Partner's answer visible only after user has answered
   */
  getTodayAnswers(coupleId: string, date: string): AsyncResult<DailyAnswer[], DomainError>;
}
