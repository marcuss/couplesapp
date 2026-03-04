/**
 * SubmitDateIdeasFeedbackUseCase
 * Persists user feedback and returns personalized date ideas.
 */

import { DateIdeas } from '../../../domain/entities/DateIdea';
import { IDateIdeasRepository } from '../../../domain/repositories/IDateIdeasRepository';

export interface SubmitFeedbackInput {
  userId: string;
  city: string;
  date: string; // YYYY-MM-DD
  feedbackText: string;
}

export class SubmitDateIdeasFeedbackUseCase {
  constructor(private readonly repo: IDateIdeasRepository) {}

  async execute(input: SubmitFeedbackInput): Promise<DateIdeas> {
    const { userId, city, date, feedbackText } = input;

    if (!feedbackText.trim()) {
      throw new Error('Feedback text cannot be empty');
    }

    // Generate personalized ideas (also saves feedback internally)
    return this.repo.getPersonalizedIdeas(userId, city, date, feedbackText);
  }
}
