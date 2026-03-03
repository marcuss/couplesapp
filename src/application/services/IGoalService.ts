/**
 * IGoalService - Application Service Interface for Goals
 * Presentation layer interacts with this interface, NOT with Supabase directly.
 * This is the port that the presentation layer uses.
 */

import { Goal } from '../../types';

export interface CreateGoalData {
  title: string;
  description?: string;
  target_date?: string;
  userId: string;
}

export interface IGoalService {
  /**
   * Get all goals for a couple (user + optional partner)
   */
  getAll(userId: string, partnerId?: string): Promise<Goal[]>;

  /**
   * Create a new goal
   */
  create(data: CreateGoalData): Promise<void>;

  /**
   * Mark a goal as completed
   */
  complete(goalId: string): Promise<void>;

  /**
   * Delete a goal
   */
  delete(goalId: string): Promise<void>;
}
