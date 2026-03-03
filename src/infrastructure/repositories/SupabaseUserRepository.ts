/**
 * Supabase User Repository
 * Implementation of IUserRepository using Supabase
 */

import { Result, AsyncResult } from '../../shared/utils/Result';
import { DomainError, NotFoundError, DatabaseError } from '../../domain/errors/DomainError';
import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { supabase } from '../../lib/supabase';

export class SupabaseUserRepository implements IUserRepository {
  async findById(id: string): AsyncResult<User | null, DomainError> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.ok(null);
        }
        return Result.fail(new DatabaseError(`Failed to find user: ${error.message}`));
      }

      if (!data) {
        return Result.ok(null);
      }

      const user = this.mapToEntity(data);
      return Result.ok(user);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findByEmail(email: string): AsyncResult<User | null, DomainError> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.ok(null);
        }
        return Result.fail(new DatabaseError(`Failed to find user: ${error.message}`));
      }

      if (!data) {
        return Result.ok(null);
      }

      const user = this.mapToEntity(data);
      return Result.ok(user);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findByPartnerId(partnerId: string): AsyncResult<User | null, DomainError> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('partner_id', partnerId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.ok(null);
        }
        return Result.fail(new DatabaseError(`Failed to find user: ${error.message}`));
      }

      if (!data) {
        return Result.ok(null);
      }

      const user = this.mapToEntity(data);
      return Result.ok(user);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async save(user: User): AsyncResult<void, DomainError> {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          name: user.name,
          partner_id: user.partnerId,
          created_at: user.createdAt.toISOString(),
          updated_at: user.updatedAt.toISOString(),
        });

      if (error) {
        return Result.fail(new DatabaseError(`Failed to save user: ${error.message}`));
      }

      return Result.ok(undefined);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async update(user: User): AsyncResult<void, NotFoundError | DomainError> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: user.name,
          partner_id: user.partnerId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.fail(new NotFoundError('User', user.id));
        }
        return Result.fail(new DatabaseError(`Failed to update user: ${error.message}`));
      }

      return Result.ok(undefined);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async delete(id: string): AsyncResult<void, NotFoundError | DomainError> {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.fail(new NotFoundError('User', id));
        }
        return Result.fail(new DatabaseError(`Failed to delete user: ${error.message}`));
      }

      return Result.ok(undefined);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async existsByEmail(email: string): AsyncResult<boolean, DomainError> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.ok(false);
        }
        return Result.fail(new DatabaseError(`Failed to check user existence: ${error.message}`));
      }

      return Result.ok(!!data);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findSingleUsers(): AsyncResult<User[], DomainError> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .is('partner_id', null);

      if (error) {
        return Result.fail(new DatabaseError(`Failed to find single users: ${error.message}`));
      }

      const users = (data || []).map(this.mapToEntity);
      return Result.ok(users);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  private mapToEntity(data: any): User {
    return User.reconstitute({
      id: data.id,
      email: data.email,
      name: data.name || undefined,
      partnerId: data.partner_id || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }
}
