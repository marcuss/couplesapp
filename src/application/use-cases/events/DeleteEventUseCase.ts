/**
 * Delete Event Use Case
 * Handles deleting an event
 */

import { Result, AsyncResult } from '../../../shared/utils/Result';
import { DomainError, UnauthorizedError, NotFoundError, ValidationError } from '../../../domain/errors/DomainError';
import { IEventRepository } from '../../../domain/repositories/IEventRepository';
import { DeleteEventDTO, DeleteEventResult } from '../../dto/DeleteEventDTO';

export class DeleteEventUseCase {
  constructor(
    private readonly eventRepository: IEventRepository
  ) {}

  async execute(dto: DeleteEventDTO): AsyncResult<DeleteEventResult, DomainError> {
    // Validate input
    const validationError = this.validateInput(dto);
    if (validationError) {
      return Result.fail(validationError);
    }

    // Find the event
    const eventResult = await this.eventRepository.findById(dto.id);
    if (eventResult.isFail()) {
      return Result.fail(eventResult.getError());
    }

    const event = eventResult.getValue();
    if (!event) {
      return Result.fail(new NotFoundError('Event', dto.id));
    }

    // Verify user can delete this event
    if (!event.canBeModifiedBy(dto.userId)) {
      return Result.fail(
        new UnauthorizedError('You do not have permission to delete this event')
      );
    }

    // Delete the event
    const deleteResult = await this.eventRepository.delete(dto.id);
    if (deleteResult.isFail()) {
      return Result.fail(deleteResult.getError());
    }

    return Result.ok({
      success: true,
      deletedAt: new Date(),
    });
  }

  private validateInput(dto: DeleteEventDTO): ValidationError | null {
    if (!dto.id || dto.id.trim().length === 0) {
      return new ValidationError('Event ID is required', 'id');
    }

    if (!dto.userId || dto.userId.trim().length === 0) {
      return new ValidationError('User ID is required', 'userId');
    }

    return null;
  }
}
