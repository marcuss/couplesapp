/**
 * Supabase Invitation Repository
 * Implementation of IInvitationRepository using Supabase
 */

import { Result, AsyncResult } from '../../shared/utils/Result';
import { DomainError, NotFoundError, DatabaseError } from '../../domain/errors/DomainError';
import { Invitation, InvitationStatus } from '../../domain/entities/Invitation';
import { IInvitationRepository } from '../../domain/repositories/IInvitationRepository';
import { supabase } from '../../lib/supabase';

export class SupabaseInvitationRepository implements IInvitationRepository {
  async findById(id: string): AsyncResult<Invitation | null, DomainError> {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.ok(null);
        }
        return Result.fail(new DatabaseError(`Failed to find invitation: ${error.message}`));
      }

      if (!data) {
        return Result.ok(null);
      }

      const invitation = this.mapToEntity(data);
      return Result.ok(invitation);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findByToken(token: string): AsyncResult<Invitation | null, DomainError> {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.ok(null);
        }
        return Result.fail(new DatabaseError(`Failed to find invitation: ${error.message}`));
      }

      if (!data) {
        return Result.ok(null);
      }

      const invitation = this.mapToEntity(data);
      return Result.ok(invitation);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findByInviter(inviterId: string): AsyncResult<Invitation[], DomainError> {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('from_user_id', inviterId)
        .order('created_at', { ascending: false });

      if (error) {
        return Result.fail(new DatabaseError(`Failed to find invitations: ${error.message}`));
      }

      const invitations = (data || []).map(this.mapToEntity);
      return Result.ok(invitations);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findByInviteeEmail(email: string): AsyncResult<Invitation[], DomainError> {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('to_email', email)
        .order('created_at', { ascending: false });

      if (error) {
        return Result.fail(new DatabaseError(`Failed to find invitations: ${error.message}`));
      }

      const invitations = (data || []).map(this.mapToEntity);
      return Result.ok(invitations);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findPendingByInviter(inviterId: string): AsyncResult<Invitation[], DomainError> {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('from_user_id', inviterId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        return Result.fail(new DatabaseError(`Failed to find invitations: ${error.message}`));
      }

      const invitations = (data || []).map(this.mapToEntity);
      return Result.ok(invitations);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findPendingByEmail(email: string): AsyncResult<Invitation[], DomainError> {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('to_email', email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        return Result.fail(new DatabaseError(`Failed to find invitations: ${error.message}`));
      }

      const invitations = (data || []).map(this.mapToEntity);
      return Result.ok(invitations);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findByStatus(
    inviterId: string,
    status: InvitationStatus
  ): AsyncResult<Invitation[], DomainError> {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('from_user_id', inviterId)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        return Result.fail(new DatabaseError(`Failed to find invitations: ${error.message}`));
      }

      const invitations = (data || []).map(this.mapToEntity);
      return Result.ok(invitations);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async findExpired(): AsyncResult<Invitation[], DomainError> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('status', 'pending')
        .lt('expires_at', now)
        .order('created_at', { ascending: false });

      if (error) {
        return Result.fail(new DatabaseError(`Failed to find expired invitations: ${error.message}`));
      }

      const invitations = (data || []).map(this.mapToEntity);
      return Result.ok(invitations);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async save(invitation: Invitation): AsyncResult<void, DomainError> {
    try {
      const { error } = await supabase
        .from('invitations')
        .insert({
          id: invitation.id,
          from_user_id: invitation.inviterId,
          to_email: invitation.inviteeEmail,
          status: invitation.status,
          created_at: invitation.createdAt.toISOString(),
        });

      if (error) {
        return Result.fail(new DatabaseError(`Failed to save invitation: ${error.message}`));
      }

      return Result.ok(undefined);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async update(invitation: Invitation): AsyncResult<void, NotFoundError | DomainError> {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({
          status: invitation.status,
          expires_at: invitation.expiresAt?.toISOString() || null,
        })
        .eq('id', invitation.id);

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.fail(new NotFoundError('Invitation', invitation.id));
        }
        return Result.fail(new DatabaseError(`Failed to update invitation: ${error.message}`));
      }

      return Result.ok(undefined);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async delete(id: string): AsyncResult<void, NotFoundError | DomainError> {
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.fail(new NotFoundError('Invitation', id));
        }
        return Result.fail(new DatabaseError(`Failed to delete invitation: ${error.message}`));
      }

      return Result.ok(undefined);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async hasPendingInvitations(inviterId: string): AsyncResult<boolean, DomainError> {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('id')
        .eq('from_user_id', inviterId)
        .eq('status', 'pending')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.ok(false);
        }
        return Result.fail(new DatabaseError(`Failed to check pending invitations: ${error.message}`));
      }

      return Result.ok(!!data);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async hasPendingInvitationsForEmail(email: string): AsyncResult<boolean, DomainError> {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('id')
        .eq('to_email', email)
        .eq('status', 'pending')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.ok(false);
        }
        return Result.fail(new DatabaseError(`Failed to check pending invitations: ${error.message}`));
      }

      return Result.ok(!!data);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  async countPendingByInviter(inviterId: string): AsyncResult<number, DomainError> {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('id', { count: 'exact' })
        .eq('from_user_id', inviterId)
        .eq('status', 'pending');

      if (error) {
        return Result.fail(new DatabaseError(`Failed to count pending invitations: ${error.message}`));
      }

      return Result.ok(data?.length || 0);
    } catch (err) {
      return Result.fail(new DatabaseError(`Unexpected error: ${(err as Error).message}`));
    }
  }

  private mapToEntity(data: any): Invitation {
    return Invitation.reconstitute({
      id: data.id,
      token: data.id, // no token column in DB, use id as token
      inviterId: data.from_user_id,
      inviteeEmail: data.to_email,
      status: data.status as InvitationStatus,
      createdAt: new Date(data.created_at),
      expiresAt: undefined, // no expires_at column in DB
    });
  }
}
