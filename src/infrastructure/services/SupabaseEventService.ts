/**
 * SupabaseEventService - Implementation of IEventService using Supabase
 *
 * Schema notes:
 * - events table uses 'user_id' (this one is correct)
 */

import { supabase } from '../../lib/supabase';
import { IEventService, CreateEventData } from '../../application/services/IEventService';
import { CalendarEvent } from '../../types';

export class SupabaseEventService implements IEventService {
  async getAll(userId: string, partnerId?: string): Promise<CalendarEvent[]> {
    const userIds = [userId];
    if (partnerId) userIds.push(partnerId);

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .or(userIds.map(id => `user_id.eq.${id}`).join(','))
      .order('date', { ascending: true });

    if (error) {
      throw new Error(`Failed to load events: ${error.message}`);
    }

    return data || [];
  }

  async create(data: CreateEventData): Promise<void> {
    const { error } = await supabase
      .from('events')
      .insert({
        title: data.title,
        description: data.description || null,
        date: data.date,
        time: data.time || null,
        user_id: data.userId,
      });

    if (error) {
      throw new Error(`Failed to create event: ${error.message}`);
    }
  }

  async update(eventId: string, data: Partial<CreateEventData>): Promise<void> {
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.time !== undefined) updateData.time = data.time;

    const { error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId);

    if (error) {
      throw new Error(`Failed to update event: ${error.message}`);
    }
  }

  async delete(eventId: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      throw new Error(`Failed to delete event: ${error.message}`);
    }
  }
}
