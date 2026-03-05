/**
 * GetUnifiedCalendarUseCase
 * Returns a unified view of all calendar events:
 *   1. CouplePlan native events (for the couple)
 *   2. External events from Google/Apple (cached)
 *
 * All events are normalized to a common UnifiedEvent interface
 * so the UI doesn't need to know about the internal differences.
 */

import { Result, AsyncResult } from '../../../shared/utils/Result';
import { DomainError, ValidationError } from '../../../domain/errors/DomainError';
import { IEventRepository } from '../../../domain/repositories/IEventRepository';
import { ICalendarEventRepository } from '../../../domain/repositories/ICalendarEventRepository';
import { CalendarProvider } from '../../../domain/entities/CalendarConnection';

export type EventSource = 'coupleplan' | CalendarProvider;

export interface UnifiedEvent {
  id: string;
  source: EventSource;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  isAllDay: boolean;
  location?: string;
  /** Display color based on source */
  color: string;
  /** Whether the user can edit this event in CouplePlan */
  isEditable: boolean;
  /** Which user owns this event */
  ownerId: string;
  /** The original entity ID (CouplePlan event ID or CalendarEvent ID) */
  sourceId: string;
  /** For external events: the external provider event ID */
  externalId?: string;
}

export interface GetUnifiedCalendarDTO {
  userId: string;
  partnerId: string;
  startDate?: Date;
  endDate?: Date;
  /** Filter by source. If omitted, returns all sources. */
  sources?: EventSource[];
}

export interface GetUnifiedCalendarResult {
  events: UnifiedEvent[];
  totalCount: number;
  bySource: Record<EventSource, number>;
}

// Color constants for each source
const SOURCE_COLORS: Record<EventSource, string> = {
  coupleplan: '#f43f5e',  // CouplePlan rose
  google: '#4285F4',       // Google blue
  apple: '#1C1C1E',        // Apple dark
};

export class GetUnifiedCalendarUseCase {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly calendarEventRepository: ICalendarEventRepository
  ) {}

  async execute(
    dto: GetUnifiedCalendarDTO
  ): AsyncResult<GetUnifiedCalendarResult, DomainError> {
    // Validate
    if (!dto.userId || dto.userId.trim().length === 0) {
      return Result.fail(new ValidationError('User ID is required', 'userId'));
    }
    if (!dto.partnerId || dto.partnerId.trim().length === 0) {
      return Result.fail(new ValidationError('Partner ID is required', 'partnerId'));
    }

    const unifiedEvents: UnifiedEvent[] = [];

    // ─── 1. CouplePlan native events ──────────────────────────────────────────
    const shouldIncludeCouplePlan =
      !dto.sources || dto.sources.includes('coupleplan');

    if (shouldIncludeCouplePlan) {
      let nativeEventsResult;

      if (dto.startDate && dto.endDate) {
        nativeEventsResult = await this.eventRepository.findByDateRange(
          dto.userId,
          dto.partnerId,
          dto.startDate,
          dto.endDate
        );
      } else {
        nativeEventsResult = await this.eventRepository.findByCouple(
          dto.userId,
          dto.partnerId
        );
      }

      if (nativeEventsResult.isFail()) {
        return Result.fail(nativeEventsResult.getError());
      }

      for (const event of nativeEventsResult.getValue()) {
        unifiedEvents.push({
          id: `coupleplan:${event.id}`,
          source: 'coupleplan',
          title: event.title,
          description: event.description,
          startTime: event.startDate,
          endTime: event.endDate,
          isAllDay: event.isAllDay,
          location: event.location,
          color: SOURCE_COLORS.coupleplan,
          isEditable: true,
          ownerId: event.createdBy,
          sourceId: event.id,
        });
      }
    }

    // ─── 2. External calendar events (Google + Apple) ─────────────────────────
    const externalSources = (dto.sources ?? ['google', 'apple']).filter(
      (s): s is CalendarProvider => s !== 'coupleplan'
    );

    if (externalSources.length > 0) {
      const externalResult = await this.calendarEventRepository.findForCouple(
        dto.userId,
        dto.partnerId,
        dto.startDate,
        dto.endDate
      );

      if (externalResult.isFail()) {
        return Result.fail(externalResult.getError());
      }

      for (const extEvent of externalResult.getValue()) {
        if (!externalSources.includes(extEvent.provider)) continue;

        unifiedEvents.push({
          id: `external:${extEvent.id}`,
          source: extEvent.provider,
          title: extEvent.title,
          description: extEvent.description,
          startTime: extEvent.startTime,
          endTime: extEvent.endTime,
          isAllDay: extEvent.isAllDay,
          location: extEvent.location,
          color: extEvent.displayColor,
          isEditable: false, // External events are read-only in CouplePlan
          ownerId: extEvent.userId,
          sourceId: extEvent.id,
          externalId: extEvent.externalId,
        });
      }
    }

    // Sort all events by start time
    unifiedEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    // Calculate counts by source
    const bySource = unifiedEvents.reduce(
      (acc, e) => {
        acc[e.source] = (acc[e.source] ?? 0) + 1;
        return acc;
      },
      {} as Record<EventSource, number>
    );

    return Result.ok({
      events: unifiedEvents,
      totalCount: unifiedEvents.length,
      bySource,
    });
  }
}
