/**
 * IDashboardService - Application Service Interface for Dashboard data
 * Aggregates data from multiple domains for the dashboard view.
 * Presentation layer interacts with this interface, NOT with Supabase directly.
 */

import { CalendarEvent, Goal, Budget, Task } from '../../types';

export interface DashboardData {
  events: CalendarEvent[];
  goals: Goal[];
  budgets: Budget[];
  tasks: Task[];
}

export interface IDashboardService {
  /**
   * Load all dashboard data for a couple.
   * Returns events, active goals, budgets, and pending tasks.
   */
  loadData(userId: string, partnerId?: string): Promise<DashboardData>;
}
