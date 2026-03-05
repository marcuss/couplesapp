/**
 * SyncCalendarEventsUseCase
 * Fetches events from external provider and updates the local cache.
 * Also pushes new CouplePlan events to external calendar.
 *
 * Note: The actual API calls to Google/Apple are made via an ICalendarApiAdapter
 * (interface defined here). In production, the adapter calls the Supabase Edge Function.
 * In tests, we inject a mock adapter.
 */

import { Result, AsyncResult } from '../../../shared/utils/Result';
import {
  DomainError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../../domain/errors/DomainError';
import { CalendarEvent } from '../../../domain/entities/CalendarEvent';
import { ICalendarConnectionRepository } from '../../../domain/repositories/ICalendarConnectionRepository';
import { ICalendarEventRepository } from '../../../domain/repositories/ICalendarEventRepository';

export interface ExternalEventData {
  externalId: string;
  calendarId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  isAllDay?: boolean;
  location?: string;
  color?: string;
  etag?: string;
}

/**
 * Adapter interface for external calendar API calls.
 * Implemented by SupabaseCalendarApiAdapter in infrastructure layer.
 * In tests, replaced by a mock.
 */
export interface ICalendarApiAdapter {
  fetchEvents(
    connectionId: string,
    calendarIds: string[],
    from: Date,
    to: Date
  ): Promise<ExternalEventData[]>;
}

export interface IIdGenerator {
  generate(): string;
}

export interface SyncCalendarEventsDTO {
  /** The authenticated user's ID */
  userId: string;
  /** Optional: sync only a specific connection. If omitted, syncs all active connections. */
  connectionId?: string;
  /** Sync window: how far back to look (default: 30 days ago) */
  fromDate?: Date;
  /** Sync window: how far forward to look (default: 90 days from now) */
  toDate?: Date;
}

export interface SyncCalendarEventsResult {
  syncedConnections: number;
  eventsPulled: number;
  eventsSkipped: number;   // events whose etag hasn't changed
  errors: Array<{ connectionId: string; error: string }>;
}

export class SyncCalendarEventsUseCase {
  constructor(
    private readonly connectionRepository: ICalendarConnectionRepository,
    private readonly eventCacheRepository: ICalendarEventRepository,
    private readonly calendarApiAdapter: ICalendarApiAdapter,
    private readonly idGenerator: IIdGenerator
  ) {}

  async execute(
    dto: SyncCalendarEventsDTO
  ): AsyncResult<SyncCalendarEventsResult, DomainError> {
    // Validate inputs
    if (!dto.userId || dto.userId.trim().length === 0) {
      return Result.fail(new ValidationError('User ID is required', 'userId'));
    }

    const from = dto.fromDate ?? this.daysAgo(30);
    const to = dto.toDate ?? this.daysFromNow(90);

    // Load connections to sync
    let connections;
    if (dto.connectionId) {
      const connResult = await this.connectionRepository.findById(dto.connectionId);
      if (connResult.isFail()) return Result.fail(connResult.getError());

      const conn = connResult.getValue();
      if (!conn) {
        return Result.fail(
          new NotFoundError(
            `Connection ${dto.connectionId} not found`,
            'CalendarConnection',
            dto.connectionId
          )
        );
      }
      if (conn.userId !== dto.userId) {
        return Result.fail(new UnauthorizedError('Not authorized to sync this connection'));
      }
      connections = [conn];
    } else {
      const allResult = await this.connectionRepository.findActiveByUser(dto.userId);
      if (allResult.isFail()) return Result.fail(allResult.getError());
      connections = allResult.getValue();
    }

    const result: SyncCalendarEventsResult = {
      syncedConnections: 0,
      eventsPulled: 0,
      eventsSkipped: 0,
      errors: [],
    };

    // Process each connection
    for (const connection of connections) {
      const enabledCalendarIds = connection.enabledCalendars.map((c) => c.id);
      if (enabledCalendarIds.length === 0) {
        result.syncedConnections++;
        continue; // Nothing to sync for this connection
      }

      try {
        // Fetch from external API
        const externalEvents = await this.calendarApiAdapter.fetchEvents(
          connection.id,
          enabledCalendarIds,
          from,
          to
        );

        // Upsert into cache
        const eventsToSave: CalendarEvent[] = [];

        for (const externalData of externalEvents) {
          // Check if we already have this event cached
          const existingResult = await this.eventCacheRepository.findByExternalId(
            connection.id,
            externalData.externalId
          );

          if (existingResult.isFail()) continue; // non-fatal

          const existing = existingResult.getValue();

          if (existing && externalData.etag && !existing.hasChangedSince(externalData.etag)) {
            result.eventsSkipped++;
            continue; // etag matches — no change
          }

          if (existing) {
            // Update existing cached event
            const refreshed = existing.refresh({
              title: externalData.title,
              description: externalData.description,
              startTime: externalData.startTime,
              endTime: externalData.endTime,
              isAllDay: externalData.isAllDay,
              location: externalData.location,
              color: externalData.color,
              etag: externalData.etag,
            });
            eventsToSave.push(refreshed);
          } else {
            // Create new cached event
            const createResult = CalendarEvent.create({
              id: this.idGenerator.generate(),
              connectionId: connection.id,
              userId: dto.userId,
              externalId: externalData.externalId,
              calendarId: externalData.calendarId,
              title: externalData.title,
              description: externalData.description,
              startTime: externalData.startTime,
              endTime: externalData.endTime,
              isAllDay: externalData.isAllDay,
              location: externalData.location,
              color: externalData.color,
              provider: connection.provider,
              etag: externalData.etag,
            });

            if (createResult.isOk()) {
              eventsToSave.push(createResult.getValue());
            }
          }
        }

        if (eventsToSave.length > 0) {
          const saveResult = await this.eventCacheRepository.saveMany(eventsToSave);
          if (saveResult.isFail()) {
            result.errors.push({
              connectionId: connection.id,
              error: saveResult.getError().message,
            });
            continue;
          }
          result.eventsPulled += eventsToSave.length;
        }

        // Mark connection as synced
        const updatedConnection = connection.recordSync();
        await this.connectionRepository.update(updatedConnection);

        result.syncedConnections++;
      } catch (err) {
        result.errors.push({
          connectionId: connection.id,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return Result.ok(result);
  }

  private daysAgo(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }

  private daysFromNow(days: number): Date {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  }
}
