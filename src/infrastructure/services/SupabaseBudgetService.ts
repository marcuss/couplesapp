/**
 * SupabaseBudgetService - Implementation of IBudgetService using Supabase
 *
 * Schema notes:
 * - budgets table uses 'created_by' (NOT 'user_id')
 */

import { supabase } from '../../lib/supabase';
import { IBudgetService, CreateBudgetData } from '../../application/services/IBudgetService';
import { Budget } from '../../types';

export class SupabaseBudgetService implements IBudgetService {
  async getAll(userId: string, partnerId?: string): Promise<Budget[]> {
    const userIds = [userId];
    if (partnerId) userIds.push(partnerId);

    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .or(userIds.map(id => `created_by.eq.${id}`).join(','))
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to load budgets: ${error.message}`);
    }

    return data || [];
  }

  async create(data: CreateBudgetData): Promise<void> {
    const { error } = await supabase
      .from('budgets')
      .insert({
        category: data.category,
        amount: data.amount,
        spent: data.spent,
        created_by: data.userId,
      });

    if (error) {
      throw new Error(`Failed to create budget: ${error.message}`);
    }
  }

  async updateSpent(budgetId: string, newSpent: number): Promise<void> {
    const { error } = await supabase
      .from('budgets')
      .update({ spent: newSpent })
      .eq('id', budgetId);

    if (error) {
      throw new Error(`Failed to update budget: ${error.message}`);
    }
  }

  async delete(budgetId: string): Promise<void> {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', budgetId);

    if (error) {
      throw new Error(`Failed to delete budget: ${error.message}`);
    }
  }
}
