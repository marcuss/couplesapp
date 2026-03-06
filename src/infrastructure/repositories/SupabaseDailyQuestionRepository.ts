/**
 * SupabaseDailyQuestionRepository
 * Implementation of IDailyQuestionRepository using Supabase.
 */

import { Result, AsyncResult } from '../../shared/utils/Result';
import { DomainError, DatabaseError } from '../../domain/errors/DomainError';
import {
  IDailyQuestionRepository,
  DailyQuestion,
  DailyAnswer,
} from '../../domain/repositories/IDailyQuestionRepository';
import { supabase } from '../../lib/supabase';

export class SupabaseDailyQuestionRepository implements IDailyQuestionRepository {
  async getDailyQuestion(coupleId: string): AsyncResult<DailyQuestion, DomainError> {
    try {
      const { data, error } = await supabase.rpc('get_daily_question', {
        p_couple_id: coupleId,
      });

      if (error) {
        return Result.fail(new DatabaseError(`Failed to get daily question: ${error.message}`));
      }

      if (!data) {
        return Result.fail(new DatabaseError('No question available'));
      }

      const question: DailyQuestion = {
        questionId: data.question_id,
        category: data.category,
        difficulty: data.difficulty,
        translations: data.translations,
        date: data.date,
      };

      return Result.ok(question);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async submitAnswer(
    coupleId: string,
    questionId: string,
    userId: string,
    answer: string
  ): AsyncResult<DailyAnswer, DomainError> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_answers')
        .insert({
          couple_id: coupleId,
          question_id: questionId,
          user_id: userId,
          answer,
          date: today,
        })
        .select()
        .single();

      if (error) {
        return Result.fail(new DatabaseError(`Failed to submit answer: ${error.message}`));
      }

      return Result.ok(this.mapAnswerToEntity(data));
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async getTodayAnswers(coupleId: string, date: string): AsyncResult<DailyAnswer[], DomainError> {
    try {
      const { data, error } = await supabase
        .from('daily_answers')
        .select('*')
        .eq('couple_id', coupleId)
        .eq('date', date);

      if (error) {
        return Result.fail(new DatabaseError(`Failed to get answers: ${error.message}`));
      }

      return Result.ok((data || []).map(this.mapAnswerToEntity));
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  private mapAnswerToEntity(data: Record<string, unknown>): DailyAnswer {
    return {
      id: data.id as string,
      coupleId: data.couple_id as string,
      questionId: data.question_id as string,
      userId: data.user_id as string,
      answer: data.answer as string,
      date: data.date as string,
      answeredAt: data.answered_at as string,
    };
  }
}
