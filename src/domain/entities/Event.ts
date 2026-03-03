/**
 * Event Entity
 * Represents a calendar event for a couple in the CouplePlan application
 */

import { Result } from '../../shared/utils/Result';
import { ValidationError } from '../errors/DomainError';

export type EventType = 'date' | 'anniversary' | 'appointment' | 'trip' | 'other';

export interface EventProps {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  type: EventType;
  isAllDay: boolean;
  createdBy: string;
  partnerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEventProps {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  type?: EventType;
  isAllDay?: boolean;
  createdBy: string;
  partnerId: string;
}

export class Event {
  private constructor(private readonly props: EventProps) {}

  /**
   * Create a new Event with validation
   */
  static create(props: CreateEventProps): Result<Event, ValidationError> {
    // Validate ID
    if (!props.id || props.id.trim().length === 0) {
      return Result.fail(new ValidationError('Event ID is required', 'id'));
    }

    // Validate title
    const titleValidation = this.validateTitle(props.title);
    if (titleValidation.isFail()) {
      return Result.fail(titleValidation.getError());
    }

    // Validate start date
    if (!props.startDate) {
      return Result.fail(new ValidationError('Start date is required', 'startDate'));
    }

    // Validate end date if provided
    if (props.endDate) {
      const endDateValidation = this.validateEndDate(props.startDate, props.endDate);
      if (endDateValidation.isFail()) {
        return Result.fail(endDateValidation.getError());
      }
    }

    // Validate createdBy
    if (!props.createdBy || props.createdBy.trim().length === 0) {
      return Result.fail(new ValidationError('Creator ID is required', 'createdBy'));
    }

    // Validate partnerId
    if (!props.partnerId || props.partnerId.trim().length === 0) {
      return Result.fail(new ValidationError('Partner ID is required', 'partnerId'));
    }

    const now = new Date();
    const event = new Event({
      ...props,
      description: props.description?.trim(),
      location: props.location?.trim(),
      type: props.type ?? 'other',
      isAllDay: props.isAllDay ?? false,
      createdAt: now,
      updatedAt: now,
    });

    return Result.ok(event);
  }

  /**
   * Reconstitute an Event from persistence (no validation)
   */
  static reconstitute(props: EventProps): Event {
    return new Event(props);
  }

  /**
   * Validate title
   */
  private static validateTitle(title: string): Result<void, ValidationError> {
    if (!title || title.trim().length === 0) {
      return Result.fail(new ValidationError('Title is required', 'title'));
    }

    if (title.trim().length < 2) {
      return Result.fail(new ValidationError('Title must be at least 2 characters', 'title'));
    }

    if (title.trim().length > 100) {
      return Result.fail(new ValidationError('Title must be at most 100 characters', 'title'));
    }

    return Result.ok(undefined);
  }

  /**
   * Validate end date
   */
  private static validateEndDate(startDate: Date, endDate: Date): Result<void, ValidationError> {
    if (endDate <= startDate) {
      return Result.fail(new ValidationError('End date must be after start date', 'endDate'));
    }

    // Don't allow events longer than 30 days
    const maxDuration = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
    if (endDate.getTime() - startDate.getTime() > maxDuration) {
      return Result.fail(new ValidationError('Event duration cannot exceed 30 days', 'endDate'));
    }

    return Result.ok(undefined);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date | undefined {
    return this.props.endDate;
  }

  get location(): string | undefined {
    return this.props.location;
  }

  get type(): EventType {
    return this.props.type;
  }

  get isAllDay(): boolean {
    return this.props.isAllDay;
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get partnerId(): string {
    return this.props.partnerId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get duration(): number {
    const end = this.props.endDate || this.props.startDate;
    return end.getTime() - this.props.startDate.getTime();
  }

  get durationInHours(): number {
    return Math.round(this.duration / (1000 * 60 * 60) * 100) / 100;
  }

  get durationInDays(): number {
    return Math.ceil(this.duration / (1000 * 60 * 60 * 24));
  }

  get isUpcoming(): boolean {
    return this.props.startDate > new Date();
  }

  get isOngoing(): boolean {
    const now = new Date();
    return this.props.startDate <= now && 
           (!this.props.endDate || this.props.endDate >= now);
  }

  get isPast(): boolean {
    const end = this.props.endDate || this.props.startDate;
    return end < new Date();
  }

  // Domain methods

  /**
   * Update event details
   */
  update(updates: {
    title?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    location?: string;
    type?: EventType;
    isAllDay?: boolean;
  }): Result<Event, ValidationError> {
    if (updates.title !== undefined) {
      const titleValidation = Event.validateTitle(updates.title);
      if (titleValidation.isFail()) {
        return Result.fail(titleValidation.getError());
      }
    }

    const newStartDate = updates.startDate ?? this.props.startDate;
    const newEndDate = updates.endDate ?? this.props.endDate;

    if (newEndDate) {
      const endDateValidation = Event.validateEndDate(newStartDate, newEndDate);
      if (endDateValidation.isFail()) {
        return Result.fail(endDateValidation.getError());
      }
    }

    const updatedEvent = new Event({
      ...this.props,
      title: updates.title ?? this.props.title,
      description: updates.description ?? this.props.description,
      startDate: newStartDate,
      endDate: newEndDate,
      location: updates.location ?? this.props.location,
      type: updates.type ?? this.props.type,
      isAllDay: updates.isAllDay ?? this.props.isAllDay,
      updatedAt: new Date(),
    });

    return Result.ok(updatedEvent);
  }

  /**
   * Change event type
   */
  changeType(type: EventType): Result<Event, ValidationError> {
    return Result.ok(
      new Event({
        ...this.props,
        type,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Toggle all-day event
   */
  toggleAllDay(): Result<Event, ValidationError> {
    return Result.ok(
      new Event({
        ...this.props,
        isAllDay: !this.props.isAllDay,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Reschedule event
   */
  reschedule(newStartDate: Date, newEndDate?: Date): Result<Event, ValidationError> {
    if (newEndDate) {
      const endDateValidation = Event.validateEndDate(newStartDate, newEndDate);
      if (endDateValidation.isFail()) {
        return Result.fail(endDateValidation.getError());
      }
    }

    return Result.ok(
      new Event({
        ...this.props,
        startDate: newStartDate,
        endDate: newEndDate,
        updatedAt: new Date(),
      })
    );
  }

  /**
   * Check if event overlaps with another
   */
  overlapsWith(other: Event): boolean {
    const thisStart = this.props.startDate.getTime();
    const thisEnd = (this.props.endDate || this.props.startDate).getTime();
    const otherStart = other.props.startDate.getTime();
    const otherEnd = (other.props.endDate || other.props.startDate).getTime();

    return thisStart < otherEnd && thisEnd > otherStart;
  }

  /**
   * Check if user can modify this event
   */
  canBeModifiedBy(userId: string): boolean {
    return this.props.createdBy === userId || this.props.partnerId === userId;
  }

  /**
   * Convert to plain object for persistence
   */
  toJSON(): EventProps {
    return { ...this.props };
  }

  /**
   * Check equality
   */
  equals(other: Event): boolean {
    return this.props.id === other.props.id;
  }
}
