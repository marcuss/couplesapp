/**
 * Create Event Use Case
 * Handles creating a new calendar event for a couple
 */

import { Result, AsyncResult } from '../../../shared/utils/Result';
import { DomainError, UnauthorizedError, ValidationError } from '../../../domain/errors/DomainError';
import { Event } from '../../../domain/entities/Event';
import { IEventRepository } from '../../../domain/repositories/IEventRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { CreateEventDTO, CreateEventResult } from '../../dto/CreateEventDTO';

export interface IIdGenerator {
  generate(): string;
}

export class CreateEventUseCase {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly userRepository: IUserRepository,
    private readonly idGenerator: IIdGenerator
  ) {}

  async execute(dto: CreateEventDTO): AsyncResult<CreateEventResult, DomainError> {
    // Validate input
    const validationError = this.validateInput(dto);
    if (validationError) {
      return Result.fail(validationError);
    }

    // Verify creator exists and has a partner
    const creatorResult = await this.userRepository.findById(dto.createdBy);
    if (creatorResult.isFail()) {
      return Result.fail(creatorResult.getError());
    }

    const creator = creatorResult.getValue();
    if (!creator) {
      return Result.fail(new UnauthorizedError('Creator not found'));
    }

    if (!creator.hasPartner) {
      return Result.fail(
        new UnauthorizedError('You need a partner to create events')
      );
    }

    // Verify the partnerId matches
    if (creator.partnerId !== dto.partnerId) {
      return Result.fail(new UnauthorizedError('Invalid partner'));
    }

    // Create the event entity
    const eventResult = Event.create({
      id: this.idGenerator.generate(),
      title: dto.title,
      description: dto.description,
      startDate: dto.startDate,
      endDate: dto.endDate,
      location: dto.location,
      type: dto.type,
      isAllDay: dto.isAllDay,
      createdBy: dto.createdBy,
      partnerId: dto.partnerId,
    });

    if (eventResult.isFail()) {
      return Result.fail(eventResult.getError());
    }

    const event = eventResult.getValue();

    // Save the event
    const saveResult = await this.eventRepository.save(event);
    if (saveResult.isFail()) {
      return Result.fail(saveResult.getError());
    }

    return Result.ok({
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      type: event.type,
      isAllDay: event.isAllDay,
      durationInHours: event.durationInHours,
    });
  }

  private validateInput(dto: CreateEventDTO): ValidationError | null {
    if (!dto.title || dto.title.trim().length === 0) {
      return new ValidationError('Title is required', 'title');
    }

    if (dto.title.trim().length < 2) {
      return new ValidationError('Title must be at least 2 characters', 'title');
    }

    if (dto.title.trim().length > 100) {
      return new ValidationError('Title must be at most 100 characters', 'title');
    }

    if (!dto.startDate) {
      return new ValidationError('Start date is required', 'startDate');
    }

    if (!(dto.startDate instanceof Date) || isNaN(dto.startDate.getTime())) {
      return new ValidationError('Start date must be a valid date', 'startDate');
    }

    if (dto.endDate) {
      if (!(dto.endDate instanceof Date) || isNaN(dto.endDate.getTime())) {
        return new ValidationError('End date must be a valid date', 'endDate');
      }
      if (dto.endDate <= dto.startDate) {
        return new ValidationError('End date must be after start date', 'endDate');
      }
      const maxDuration = 30 * 24 * 60 * 60 * 1000;
      if (dto.endDate.getTime() - dto.startDate.getTime() > maxDuration) {
        return new ValidationError('Event duration cannot exceed 30 days', 'endDate');
      }
    }

    if (!dto.createdBy || dto.createdBy.trim().length === 0) {
      return new ValidationError('Creator ID is required', 'createdBy');
    }

    if (!dto.partnerId || dto.partnerId.trim().length === 0) {
      return new ValidationError('Partner ID is required', 'partnerId');
    }

    return null;
  }
}
