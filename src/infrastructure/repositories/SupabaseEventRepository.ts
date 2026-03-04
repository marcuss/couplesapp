/**
 * Supabase Event Repository
 * Implementation of IEventRepository using Supabase
 */

import { Result, AsyncResult } from '../../shared/utils/Result';
import { DomainError, NotFoundError, DatabaseError } from '../../domain/errors/DomainError';
import { Event, EventType } from '../../domain/entities/Event';
import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { supabase } from '../../lib/supabase';

export class SupabaseEventRepository implements IEventRepository {
  async findById(id: string): AsyncResult<Event | null, DomainError> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.ok(null);
        }
        return Result.fail(new DatabaseError(`Failed to find event: ${error.message}`));
      }

      if (!data) {
        return Result.ok(null);
      }

      const event = this.mapToEntity(data);
      return Result.ok(event);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findByUserId(userId: string): AsyncResult<Event[], DomainError> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });

      if (error) {
        return Result.fail(new DatabaseError(`Failed to find events: ${error.message}`));
      }

      const events = (data || []).map(this.mapToEntity);
      return Result.ok(events);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findByCouple(userId: string, partnerId: string): AsyncResult<Event[], DomainError> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .or(`user_id.eq.${userId},user_id.eq.${partnerId}`)
        .order('date', { ascending: true });

      if (error) {
        return Result.fail(new DatabaseError(`Failed to find events: ${error.message}`));
      }

      const events = (data || []).map(this.mapToEntity);
      return Result.ok(events);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date): AsyncResult<Event[], DomainError> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) {
        return Result.fail(new DatabaseError(`Failed to find events: ${error.message}`));
      }

      const events = (data || []).map(this.mapToEntity);
      return Result.ok(events);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findUpcoming(userId: string, limit: number = 10): AsyncResult<Event[], DomainError> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', userId)
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(limit);

      if (error) {
        return Result.fail(new DatabaseError(`Failed to find upcoming events: ${error.message}`));
      }

      const events = (data || []).map(this.mapToEntity);
      return Result.ok(events);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async save(event: Event): AsyncResult<void, DomainError> {
    try {
      const { error } = await supabase
        .from('events')
        .insert({
          id: event.id,
          title: event.title,
          description: event.description || null,
          date: event.startDate.toISOString().split('T')[0],
          time: event.isAllDay ? null : event.startDate.toTimeString().slice(0, 5),
          location: event.location || null,
          type: event.type,
          is_all_day: event.isAllDay,
          user_id: event.createdBy,
          partner_id: event.partnerId,
          created_at: event.createdAt.toISOString(),
          updated_at: event.updatedAt.toISOString(),
        });

      if (error) {
        return Result.fail(new DatabaseError(`Failed to save event: ${error.message}`));
      }

      return Result.ok(undefined);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async update(event: Event): AsyncResult<void, NotFoundError | DomainError> {
    try {
      const { error } = await supabase
        .from('events')
        .update({
          title: event.title,
          description: event.description || null,
          date: event.startDate.toISOString().split('T')[0],
          time: event.isAllDay ? null : event.startDate.toTimeString().slice(0, 5),
          location: event.location || null,
          type: event.type,
          is_all_day: event.isAllDay,
          updated_at: new Date().toISOString(),
        })
        .eq('id', event.id);

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.fail(new NotFoundError('Event', event.id));
        }
        return Result.fail(new DatabaseError(`Failed to update event: ${error.message}`));
      }

      return Result.ok(undefined);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async delete(id: string): AsyncResult<void, NotFoundError | DomainError> {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.fail(new NotFoundError('Event', id));
        }
        return Result.fail(new DatabaseError(`Failed to delete event: ${error.message}`));
      }

      return Result.ok(undefined);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async countByUserId(userId: string): AsyncResult<number, DomainError> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      if (error) {
        return Result.fail(new DatabaseError(`Failed to count events: ${error.message}`));
      }

      return Result.ok(data?.length || 0);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToEntity(data: any): Event {
    const dateStr = data.date;
    const timeStr = data.time || '00:00';
    const startDate = new Date(`${dateStr}T${timeStr}`);

    return Event.reconstitute({
      id: data.id,
      title: data.title,
      description: data.description || undefined,
      startDate,
      endDate: undefined,
      location: data.location || undefined,
      type: (data.type as EventType) || 'other',
      isAllDay: data.is_all_day || false,
      createdBy: data.user_id,
      partnerId: data.partner_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }
}
