/**
 * IDateIdeasRepository
 * Port (interface) for fetching and storing date ideas
 */

import { DateIdeas } from '../entities/DateIdea';

export interface IDateIdeasRepository {
  /** Get AI-generated ideas for a city on a specific date */
  getIdeasForCity(city: string, date: string): Promise<DateIdeas | null>;

  /** Save user feedback about the suggestions */
  saveFeedback(userId: string, city: string, date: string, feedback: string): Promise<void>;

  /** Generate and return personalized ideas based on feedback */
  getPersonalizedIdeas(
    userId: string,
    city: string,
    date: string,
    feedback: string
  ): Promise<DateIdeas>;
}
