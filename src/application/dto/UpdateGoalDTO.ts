/**
 * Update Goal DTO (Data Transfer Object)
 */

import { GoalPriority, GoalStatus } from '../../domain/entities/Goal';

export interface UpdateGoalDTO {
  goalId: string;
  userId: string;
  title?: string;
  description?: string;
  targetDate?: Date;
  priority?: GoalPriority;
  status?: GoalStatus;
}

export interface UpdateGoalResult {
  id: string;
  title: string;
  description?: string;
  targetDate?: Date;
  status: string;
  priority: GoalPriority;
  updatedAt: Date;
}
