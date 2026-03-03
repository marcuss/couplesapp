/**
 * SupabaseTaskService - Implementation of ITaskService using Supabase
 *
 * Schema notes:
 * - tasks table uses 'created_by' (NOT 'user_id')
 * - tasks table uses 'completed' boolean (NOT 'status' text)
 */

import { supabase } from '../../lib/supabase';
import { ITaskService, CreateTaskData } from '../../application/services/ITaskService';
import { Task } from '../../types';

export class SupabaseTaskService implements ITaskService {
  async getAll(userId: string, partnerId?: string): Promise<Task[]> {
    const userIds = [userId];
    if (partnerId) userIds.push(partnerId);

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .or(userIds.map(id => `created_by.eq.${id}`).join(','))
      .order('due_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to load tasks: ${error.message}`);
    }

    return data || [];
  }

  async create(data: CreateTaskData): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .insert({
        title: data.title,
        description: data.description || null,
        due_date: data.due_date || null,
        completed: false,
        created_by: data.userId,
      });

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }
  }

  async toggleComplete(taskId: string, currentCompleted: boolean): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({ completed: !currentCompleted })
      .eq('id', taskId);

    if (error) {
      throw new Error(`Failed to toggle task: ${error.message}`);
    }
  }

  async delete(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  }
}
