/**
 * DisconnectCalendarUseCase
 * Handles disconnecting an external calendar provider for a user.
 * Deletes the connection (and all associated cached events via DB cascade).
 */

import { Result, AsyncResult } from '../../../shared/utils/Result';
import {
  DomainError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../../domain/errors/DomainError';
import { ICalendarConnectionRepository } from '../../../domain/repositories/ICalendarConnectionRepository';
import { ICalendarEventRepository } from '../../../domain/repositories/ICalendarEventRepository';

export interface DisconnectCalendarDTO {
  /** The authenticated user's ID */
  userId: string;
  /** The connection ID to disconnect */
  connectionId: string;
}

export interface DisconnectCalendarResult {
  disconnected: true;
  connectionId: string;
  provider: string;
}

export class DisconnectCalendarUseCase {
  constructor(
    private readonly connectionRepository: ICalendarConnectionRepository,
    private readonly eventCacheRepository: ICalendarEventRepository
  ) {}

  async execute(
    dto: DisconnectCalendarDTO
  ): AsyncResult<DisconnectCalendarResult, DomainError> {
    // Validate inputs
    if (!dto.userId || dto.userId.trim().length === 0) {
      return Result.fail(new ValidationError('User ID is required', 'userId'));
    }

    if (!dto.connectionId || dto.connectionId.trim().length === 0) {
      return Result.fail(new ValidationError('Connection ID is required', 'connectionId'));
    }

    // Find the connection
    const connectionResult = await this.connectionRepository.findById(dto.connectionId);
    if (connectionResult.isFail()) {
      return Result.fail(connectionResult.getError());
    }

    const connection = connectionResult.getValue();
    if (!connection) {
      return Result.fail(
        new NotFoundError(
          `Calendar connection ${dto.connectionId} not found`,
          'CalendarConnection',
          dto.connectionId
        )
      );
    }

    // Authorization: only the owner can disconnect
    if (connection.userId !== dto.userId) {
      return Result.fail(
        new UnauthorizedError('You are not authorized to disconnect this calendar')
      );
    }

    const provider = connection.provider;

    // Delete cached events first (explicit cleanup before cascade, for clarity)
    const deleteEventsResult = await this.eventCacheRepository.deleteByConnection(
      dto.connectionId
    );
    if (deleteEventsResult.isFail()) {
      return Result.fail(deleteEventsResult.getError());
    }

    // Delete the connection
    const deleteResult = await this.connectionRepository.delete(dto.connectionId);
    if (deleteResult.isFail()) {
      return Result.fail(deleteResult.getError());
    }

    return Result.ok({
      disconnected: true,
      connectionId: dto.connectionId,
      provider,
    });
  }
}
