/**
 * SupabaseDashboardService - Implementation of IDashboardService
 * Aggregates data from multiple Supabase tables for the dashboard.
 */

import { supabase } from '../../lib/supabase';
import { IDashboardService, DashboardData } from '../../application/services/IDashboardService';

export class SupabaseDashboardService implements IDashboardService {
  async loadData(userId: string, partnerId?: string): Promise<DashboardData> {
    const userIds = [userId];
    if (partnerId) userIds.push(partnerId);

    const [eventsResult, goalsResult, budgetsResult, tasksResult] = await Promise.allSettled([
      // events: uses 'user_id'
      supabase
        .from('events')
        .select('*')
        .or(userIds.map(id => `user_id.eq.${id}`).join(','))
        .order('date', { ascending: true }),

      // goals: uses 'created_by', 'completed' boolean — only active ones
      supabase
        .from('goals')
        .select('*')
        .or(userIds.map(id => `created_by.eq.${id}`).join(','))
        .eq('completed', false)
        .order('created_at', { ascending: false })
        .limit(5),

      // budgets: uses 'created_by'
      supabase
        .from('budgets')
        .select('*')
        .or(userIds.map(id => `created_by.eq.${id}`).join(',')),

      // tasks: uses 'created_by', 'completed' boolean — only pending ones
      supabase
        .from('tasks')
        .select('*')
        .or(userIds.map(id => `created_by.eq.${id}`).join(','))
        .eq('completed', false)
        .order('due_date', { ascending: true })
        .limit(5),
    ]);

    const events =
      eventsResult.status === 'fulfilled' && !eventsResult.value.error
        ? eventsResult.value.data || []
        : [];

    const goals =
      goalsResult.status === 'fulfilled' && !goalsResult.value.error
        ? goalsResult.value.data || []
        : [];

    const budgets =
      budgetsResult.status === 'fulfilled' && !budgetsResult.value.error
        ? budgetsResult.value.data || []
        : [];

    const tasks =
      tasksResult.status === 'fulfilled' && !tasksResult.value.error
        ? tasksResult.value.data || []
        : [];

    return { events, goals, budgets, tasks };
  }
}
