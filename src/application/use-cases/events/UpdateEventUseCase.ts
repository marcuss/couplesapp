/**
 * Update Event Use Case
 * Handles updating an existing event
 */

import { Result, AsyncResult } from '../../../shared/utils/Result';
import { DomainError, UnauthorizedError, NotFoundError, ValidationError } from '../../../domain/errors/DomainError';
import { IEventRepository } from '../../../domain/repositories/IEventRepository';
import { UpdateEventDTO, UpdateEventResult } from '../../dto/UpdateEventDTO';

export class UpdateEventUseCase {
  constructor(
    private readonly eventRepository: IEventRepository
  ) {}

  async execute(dto: UpdateEventDTO): AsyncResult<UpdateEventResult, DomainError> {
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

    // Verify user can modify this event
    if (!event.canBeModifiedBy(dto.userId)) {
      return Result.fail(
        new UnauthorizedError('You do not have permission to update this event')
      );
    }

    // Apply updates
    const updateResult = event.update({
      title: dto.title,
      description: dto.description,
      startDate: dto.startDate,
      endDate: dto.endDate,
      location: dto.location,
      type: dto.type,
      isAllDay: dto.isAllDay,
    });

    if (updateResult.isFail()) {
      return Result.fail(updateResult.getError());
    }

    const updatedEvent = updateResult.getValue();

    // Save the updated event
    const saveResult = await this.eventRepository.update(updatedEvent);
    if (saveResult.isFail()) {
      return Result.fail(saveResult.getError());
    }

    return Result.ok({
      id: updatedEvent.id,
      title: updatedEvent.title,
      description: updatedEvent.description,
      startDate: updatedEvent.startDate,
      endDate: updatedEvent.endDate,
      location: updatedEvent.location,
      type: updatedEvent.type,
      isAllDay: updatedEvent.isAllDay,
      durationInHours: updatedEvent.durationInHours,
    });
  }

  private validateInput(dto: UpdateEventDTO): ValidationError | null {
    if (!dto.id || dto.id.trim().length === 0) {
      return new ValidationError('Event ID is required', 'id');
    }

    if (!dto.userId || dto.userId.trim().length === 0) {
      return new ValidationError('User ID is required', 'userId');
    }

    if (dto.title !== undefined) {
      if (dto.title.trim().length === 0) {
        return new ValidationError('Title cannot be empty', 'title');
      }
      if (dto.title.trim().length < 2) {
        return new ValidationError('Title must be at least 2 characters', 'title');
      }
      if (dto.title.trim().length > 100) {
        return new ValidationError('Title must be at most 100 characters', 'title');
      }
    }

    if (dto.startDate !== undefined) {
      if (!(dto.startDate instanceof Date) || isNaN(dto.startDate.getTime())) {
        return new ValidationError('Start date must be a valid date', 'startDate');
      }
    }

    if (dto.endDate !== undefined) {
      if (!(dto.endDate instanceof Date) || isNaN(dto.endDate.getTime())) {
        return new ValidationError('End date must be a valid date', 'endDate');
      }
    }

    return null;
  }
}
