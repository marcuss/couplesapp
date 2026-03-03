/**
 * SupabaseGoalService - Implementation of IGoalService using Supabase
 *
 * Schema notes:
 * - goals table uses 'created_by' (NOT 'user_id')
 * - goals table uses 'completed' boolean (NOT 'status' text)
 */

import { supabase } from '../../lib/supabase';
import { IGoalService, CreateGoalData } from '../../application/services/IGoalService';
import { Goal } from '../../types';

export class SupabaseGoalService implements IGoalService {
  async getAll(userId: string, partnerId?: string): Promise<Goal[]> {
    const userIds = [userId];
    if (partnerId) userIds.push(partnerId);

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .or(userIds.map(id => `created_by.eq.${id}`).join(','))
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to load goals: ${error.message}`);
    }

    return data || [];
  }

  async create(data: CreateGoalData): Promise<void> {
    const { error } = await supabase
      .from('goals')
      .insert({
        title: data.title,
        description: data.description || null,
        target_date: data.target_date || null,
        completed: false,
        created_by: data.userId,
      });

    if (error) {
      throw new Error(`Failed to create goal: ${error.message}`);
    }
  }

  async complete(goalId: string): Promise<void> {
    const { error } = await supabase
      .from('goals')
      .update({ completed: true })
      .eq('id', goalId);

    if (error) {
      throw new Error(`Failed to complete goal: ${error.message}`);
    }
  }

  async delete(goalId: string): Promise<void> {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId);

    if (error) {
      throw new Error(`Failed to delete goal: ${error.message}`);
    }
  }
}
