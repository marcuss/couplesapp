/**
 * Supabase Task Repository
 * Implementation of ITaskRepository using Supabase
 */

import { Result, AsyncResult } from '../../shared/utils/Result';
import { DomainError, NotFoundError, DatabaseError } from '../../domain/errors/DomainError';
import { Task, TaskStatus, TaskPriority } from '../../domain/entities/Task';
import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { supabase } from '../../lib/supabase';

export class SupabaseTaskRepository implements ITaskRepository {
  async findById(id: string): AsyncResult<Task | null, DomainError> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.ok(null);
        }
        return Result.fail(new DatabaseError(`Failed to find task: ${error.message}`));
      }

      if (!data) {
        return Result.ok(null);
      }

      const task = this.mapToEntity(data);
      return Result.ok(task);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findByUserId(userId: string): AsyncResult<Task[], DomainError> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return Result.fail(new DatabaseError(`Failed to find tasks: ${error.message}`));
      }

      const tasks = (data || []).map(this.mapToEntity);
      return Result.ok(tasks);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findByCouple(userId: string, partnerId: string): AsyncResult<Task[], DomainError> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .or(`user_id.eq.${userId},user_id.eq.${partnerId}`)
        .order('created_at', { ascending: false });

      if (error) {
        return Result.fail(new DatabaseError(`Failed to find tasks: ${error.message}`));
      }

      const tasks = (data || []).map(this.mapToEntity);
      return Result.ok(tasks);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findByStatus(userId: string, status: TaskStatus): AsyncResult<Task[], DomainError> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        return Result.fail(new DatabaseError(`Failed to find tasks: ${error.message}`));
      }

      const tasks = (data || []).map(this.mapToEntity);
      return Result.ok(tasks);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findByAssignee(assigneeId: string): AsyncResult<Task[], DomainError> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', assigneeId)
        .order('created_at', { ascending: false });

      if (error) {
        return Result.fail(new DatabaseError(`Failed to find tasks: ${error.message}`));
      }

      const tasks = (data || []).map(this.mapToEntity);
      return Result.ok(tasks);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findByGoalId(goalId: string): AsyncResult<Task[], DomainError> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('goal_id', goalId)
        .order('created_at', { ascending: false });

      if (error) {
        return Result.fail(new DatabaseError(`Failed to find tasks: ${error.message}`));
      }

      const tasks = (data || []).map(this.mapToEntity);
      return Result.ok(tasks);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findOverdue(userId: string): AsyncResult<Task[], DomainError> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .lt('due_date', today)
        .neq('status', 'completed')
        .order('due_date', { ascending: true });

      if (error) {
        return Result.fail(new DatabaseError(`Failed to find overdue tasks: ${error.message}`));
      }

      const tasks = (data || []).map(this.mapToEntity);
      return Result.ok(tasks);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async save(task: Task): AsyncResult<void, DomainError> {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          id: task.id,
          title: task.title,
          description: task.description || null,
          status: task.status,
          priority: task.priority,
          due_date: task.dueDate?.toISOString().split('T')[0] || null,
          assigned_to: task.assignedTo || null,
          goal_id: task.goalId || null,
          user_id: task.createdBy,
          partner_id: task.partnerId,
          completed_at: task.completedAt?.toISOString() || null,
          created_at: task.createdAt.toISOString(),
          updated_at: task.updatedAt.toISOString(),
        });

      if (error) {
        return Result.fail(new DatabaseError(`Failed to save task: ${error.message}`));
      }

      return Result.ok(undefined);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async update(task: Task): AsyncResult<void, NotFoundError | DomainError> {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: task.title,
          description: task.description || null,
          status: task.status,
          priority: task.priority,
          due_date: task.dueDate?.toISOString().split('T')[0] || null,
          assigned_to: task.assignedTo || null,
          goal_id: task.goalId || null,
          completed_at: task.completedAt?.toISOString() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.fail(new NotFoundError('Task', task.id));
        }
        return Result.fail(new DatabaseError(`Failed to update task: ${error.message}`));
      }

      return Result.ok(undefined);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async delete(id: string): AsyncResult<void, NotFoundError | DomainError> {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.fail(new NotFoundError('Task', id));
        }
        return Result.fail(new DatabaseError(`Failed to delete task: ${error.message}`));
      }

      return Result.ok(undefined);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async countByUserId(userId: string): AsyncResult<number, DomainError> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      if (error) {
        return Result.fail(new DatabaseError(`Failed to count tasks: ${error.message}`));
      }

      return Result.ok(data?.length || 0);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  private mapToEntity(data: any): Task {
    return Task.reconstitute({
      id: data.id,
      title: data.title,
      description: data.description || undefined,
      status: data.status as TaskStatus,
      priority: data.priority as TaskPriority,
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      assignedTo: data.assigned_to || undefined,
      goalId: data.goal_id || undefined,
      createdBy: data.user_id,
      partnerId: data.partner_id,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }
}
