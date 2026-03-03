/**
 * Create Goal DTO (Data Transfer Object)
 */

import { GoalPriority } from '../../domain/entities/Goal';

export interface CreateGoalDTO {
  title: string;
  description?: string;
  targetDate?: Date;
  priority?: GoalPriority;
  createdBy: string;
  partnerId: string;
}

export interface CreateGoalResult {
  id: string;
  title: string;
  description?: string;
  targetDate?: Date;
  status: string;
  priority: GoalPriority;
}
