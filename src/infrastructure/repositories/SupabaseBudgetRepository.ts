/**
 * Supabase Budget Repository
 * Implementation of IBudgetRepository using Supabase
 */

import { Result, AsyncResult } from '../../shared/utils/Result';
import { DomainError, NotFoundError, DatabaseError } from '../../domain/errors/DomainError';
import { Budget, BudgetCategory } from '../../domain/entities/Budget';
import { IBudgetRepository } from '../../domain/repositories/IBudgetRepository';
import { supabase } from '../../lib/supabase';

export class SupabaseBudgetRepository implements IBudgetRepository {
  async findById(id: string): AsyncResult<Budget | null, DomainError> {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.ok(null);
        }
        return Result.fail(new DatabaseError(`Failed to find budget: ${error.message}`));
      }

      if (!data) {
        return Result.ok(null);
      }

      const budget = this.mapToEntity(data);
      return Result.ok(budget);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findByUserId(userId: string): AsyncResult<Budget[], DomainError> {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        return Result.fail(new DatabaseError(`Failed to find budgets: ${error.message}`));
      }

      const budgets = (data || []).map(this.mapToEntity);
      return Result.ok(budgets);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findByCouple(userId: string, partnerId: string): AsyncResult<Budget[], DomainError> {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .or(`user_id.eq.${userId},user_id.eq.${partnerId}`);

      if (error) {
        return Result.fail(new DatabaseError(`Failed to find budgets: ${error.message}`));
      }

      const budgets = (data || []).map(this.mapToEntity);
      return Result.ok(budgets);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findByCategory(userId: string, category: BudgetCategory): AsyncResult<Budget[], DomainError> {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category);

      if (error) {
        return Result.fail(new DatabaseError(`Failed to find budgets: ${error.message}`));
      }

      const budgets = (data || []).map(this.mapToEntity);
      return Result.ok(budgets);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async save(budget: Budget): AsyncResult<void, DomainError> {
    try {
      const { error } = await supabase
        .from('budgets')
        .insert({
          id: budget.id,
          name: budget.name,
          amount: budget.amount,
          spent: budget.spent,
          category: budget.category,
          notes: budget.notes || null,
          user_id: budget.createdBy,
          partner_id: budget.partnerId,
          created_at: budget.createdAt.toISOString(),
          updated_at: budget.updatedAt.toISOString(),
        });

      if (error) {
        return Result.fail(new DatabaseError(`Failed to save budget: ${error.message}`));
      }

      return Result.ok(undefined);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async update(budget: Budget): AsyncResult<void, NotFoundError | DomainError> {
    try {
      const { error } = await supabase
        .from('budgets')
        .update({
          name: budget.name,
          amount: budget.amount,
          spent: budget.spent,
          category: budget.category,
          notes: budget.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', budget.id);

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.fail(new NotFoundError('Budget', budget.id));
        }
        return Result.fail(new DatabaseError(`Failed to update budget: ${error.message}`));
      }

      return Result.ok(undefined);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async delete(id: string): AsyncResult<void, NotFoundError | DomainError> {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.fail(new NotFoundError('Budget', id));
        }
        return Result.fail(new DatabaseError(`Failed to delete budget: ${error.message}`));
      }

      return Result.ok(undefined);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async getTotalBudget(userId: string): AsyncResult<number, DomainError> {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('amount')
        .eq('user_id', userId);

      if (error) {
        return Result.fail(new DatabaseError(`Failed to get total budget: ${error.message}`));
      }

      const total = (data || []).reduce((sum, item) => sum + (item.amount || 0), 0);
      return Result.ok(total);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async getTotalSpent(userId: string): AsyncResult<number, DomainError> {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('spent')
        .eq('user_id', userId);

      if (error) {
        return Result.fail(new DatabaseError(`Failed to get total spent: ${error.message}`));
      }

      const total = (data || []).reduce((sum, item) => sum + (item.spent || 0), 0);
      return Result.ok(total);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToEntity(data: any): Budget {
    return Budget.reconstitute({
      id: data.id,
      name: data.name,
      amount: data.amount,
      spent: data.spent || 0,
      category: data.category as BudgetCategory,
      notes: data.notes || undefined,
      createdBy: data.user_id,
      partnerId: data.partner_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }
}
