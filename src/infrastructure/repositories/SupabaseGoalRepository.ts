/**
 * Supabase Goal Repository
 * Implementation of IGoalRepository using Supabase
 */

import { Result, AsyncResult } from '../../shared/utils/Result';
import { DomainError, NotFoundError, DatabaseError } from '../../domain/errors/DomainError';
import { Goal, GoalStatus, GoalPriority } from '../../domain/entities/Goal';
import { IGoalRepository } from '../../domain/repositories/IGoalRepository';
import { supabase } from '../../lib/supabase';

export class SupabaseGoalRepository implements IGoalRepository {
  async findById(id: string): AsyncResult<Goal | null, DomainError> {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.ok(null);
        }
        return Result.fail(new DatabaseError(`Failed to find goal: ${error.message}`));
      }

      if (!data) {
        return Result.ok(null);
      }

      const goal = this.mapToEntity(data);
      return Result.ok(goal);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findByUserId(userId: string): AsyncResult<Goal[], DomainError> {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        return Result.fail(new DatabaseError(`Failed to find goals: ${error.message}`));
      }

      const goals = (data || []).map(this.mapToEntity);
      return Result.ok(goals);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findByPartnerId(partnerId: string): AsyncResult<Goal[], DomainError> {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('partner_id', partnerId);

      if (error) {
        return Result.fail(new DatabaseError(`Failed to find goals: ${error.message}`));
      }

      const goals = (data || []).map(this.mapToEntity);
      return Result.ok(goals);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findByCouple(userId: string, partnerId: string): AsyncResult<Goal[], DomainError> {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .or(`user_id.eq.${userId},user_id.eq.${partnerId}`);

      if (error) {
        return Result.fail(new DatabaseError(`Failed to find goals: ${error.message}`));
      }

      const goals = (data || []).map(this.mapToEntity);
      return Result.ok(goals);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findByStatus(userId: string, status: GoalStatus): AsyncResult<Goal[], DomainError> {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('status', status);

      if (error) {
        return Result.fail(new DatabaseError(`Failed to find goals: ${error.message}`));
      }

      const goals = (data || []).map(this.mapToEntity);
      return Result.ok(goals);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async save(goal: Goal): AsyncResult<void, DomainError> {
    try {
      const { error } = await supabase
        .from('goals')
        .insert({
          id: goal.id,
          title: goal.title,
          description: goal.description || null,
          target_date: goal.targetDate?.toISOString() || null,
          status: goal.status,
          priority: goal.priority,
          user_id: goal.createdBy,
          partner_id: goal.partnerId,
          created_at: goal.createdAt.toISOString(),
          updated_at: goal.updatedAt.toISOString(),
        });

      if (error) {
        return Result.fail(new DatabaseError(`Failed to save goal: ${error.message}`));
      }

      return Result.ok(undefined);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async update(goal: Goal): AsyncResult<void, NotFoundError | DomainError> {
    try {
      const { error } = await supabase
        .from('goals')
        .update({
          title: goal.title,
          description: goal.description || null,
          target_date: goal.targetDate?.toISOString() || null,
          status: goal.status,
          priority: goal.priority,
          updated_at: new Date().toISOString(),
        })
        .eq('id', goal.id);

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.fail(new NotFoundError('Goal', goal.id));
        }
        return Result.fail(new DatabaseError(`Failed to update goal: ${error.message}`));
      }

      return Result.ok(undefined);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async delete(id: string): AsyncResult<void, NotFoundError | DomainError> {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.fail(new NotFoundError('Goal', id));
        }
        return Result.fail(new DatabaseError(`Failed to delete goal: ${error.message}`));
      }

      return Result.ok(undefined);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async existsById(id: string): AsyncResult<boolean, DomainError> {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('id')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.ok(false);
        }
        return Result.fail(new DatabaseError(`Failed to check goal existence: ${error.message}`));
      }

      return Result.ok(!!data);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async countByUserId(userId: string): AsyncResult<number, DomainError> {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      if (error) {
        return Result.fail(new DatabaseError(`Failed to count goals: ${error.message}`));
      }

      return Result.ok(data?.length || 0);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  private mapToEntity(data: any): Goal {
    return Goal.reconstitute({
      id: data.id,
      title: data.title,
      description: data.description || undefined,
      targetDate: data.target_date ? new Date(data.target_date) : undefined,
      status: data.status as GoalStatus,
      priority: data.priority as GoalPriority,
      createdBy: data.user_id,
      partnerId: data.partner_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }
}
