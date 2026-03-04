/**
 * DateIdea entity validation tests
 */
import { describe, it, expect } from 'vitest';
import {
  validateDateIdeaItem,
  validateDateIdeas,
  isValidCategory,
  isValidCost,
  isValidTimeOfDay,
  isValidIndoorOutdoor,
  DateIdeaItem,
  DateIdeas,
} from '../DateIdea';

// ─── Fixtures ─────────────────────────────────────────────────────────────

const validItem: DateIdeaItem = {
  id: 'idea-1',
  title: 'Cena romántica',
  category: 'restaurant',
  description: 'Una cena especial para dos',
  estimatedCost: 'medium',
  emoji: '🍝',
  timeOfDay: 'evening',
  indoorOutdoor: 'indoor',
  tags: ['romántico', 'cena'],
};

const validDateIdeas: DateIdeas = {
  id: 'di-1',
  city: 'Medellín',
  date: '2026-03-04',
  ideas: [validItem],
  cityNote: 'Primavera en Medellín',
  generatedAt: '2026-03-04T06:00:00Z',
};

// ─── isValidCategory ──────────────────────────────────────────────────────

describe('isValidCategory', () => {
  it('returns true for all valid categories', () => {
    const valid = [
      'restaurant', 'concert', 'outdoor', 'cultural', 'sport',
      'entertainment', 'romantic', 'adventure', 'art', 'other',
    ];
    valid.forEach((c) => expect(isValidCategory(c)).toBe(true));
  });

  it('returns false for unknown category', () => {
    expect(isValidCategory('shopping')).toBe(false);
    expect(isValidCategory('')).toBe(false);
    expect(isValidCategory(null)).toBe(false);
  });
});

// ─── isValidCost ─────────────────────────────────────────────────────────

describe('isValidCost', () => {
  it('accepts all cost levels', () => {
    ['free', 'low', 'medium', 'high'].forEach((c) =>
      expect(isValidCost(c)).toBe(true)
    );
  });

  it('rejects invalid cost', () => {
    expect(isValidCost('expensive')).toBe(false);
    expect(isValidCost(undefined)).toBe(false);
  });
});

// ─── isValidTimeOfDay ────────────────────────────────────────────────────

describe('isValidTimeOfDay', () => {
  it('accepts all time slots', () => {
    ['morning', 'afternoon', 'evening', 'night', 'any'].forEach((t) =>
      expect(isValidTimeOfDay(t)).toBe(true)
    );
  });

  it('rejects invalid time', () => {
    expect(isValidTimeOfDay('midnight')).toBe(false);
  });
});

// ─── isValidIndoorOutdoor ────────────────────────────────────────────────

describe('isValidIndoorOutdoor', () => {
  it('accepts indoor, outdoor, both', () => {
    ['indoor', 'outdoor', 'both'].forEach((v) =>
      expect(isValidIndoorOutdoor(v)).toBe(true)
    );
  });

  it('rejects invalid value', () => {
    expect(isValidIndoorOutdoor('underwater')).toBe(false);
  });
});

// ─── validateDateIdeaItem ────────────────────────────────────────────────

describe('validateDateIdeaItem', () => {
  it('validates a correct item', () => {
    expect(validateDateIdeaItem(validItem)).toBe(true);
  });

  it('rejects null / non-object', () => {
    expect(validateDateIdeaItem(null)).toBe(false);
    expect(validateDateIdeaItem('string')).toBe(false);
    expect(validateDateIdeaItem(42)).toBe(false);
  });

  it('rejects item with empty id', () => {
    expect(validateDateIdeaItem({ ...validItem, id: '' })).toBe(false);
  });

  it('rejects item with empty title', () => {
    expect(validateDateIdeaItem({ ...validItem, title: '' })).toBe(false);
  });

  it('rejects item with invalid category', () => {
    expect(validateDateIdeaItem({ ...validItem, category: 'shopping' })).toBe(false);
  });

  it('rejects item with invalid estimatedCost', () => {
    expect(validateDateIdeaItem({ ...validItem, estimatedCost: 'priceless' })).toBe(false);
  });

  it('rejects item with invalid timeOfDay', () => {
    expect(validateDateIdeaItem({ ...validItem, timeOfDay: 'midnight' })).toBe(false);
  });

  it('rejects item with invalid indoorOutdoor', () => {
    expect(validateDateIdeaItem({ ...validItem, indoorOutdoor: 'underwater' })).toBe(false);
  });

  it('rejects item without tags array', () => {
    expect(validateDateIdeaItem({ ...validItem, tags: 'romantic' })).toBe(false);
  });

  it('accepts item with empty tags array', () => {
    expect(validateDateIdeaItem({ ...validItem, tags: [] })).toBe(true);
  });
});

// ─── validateDateIdeas ───────────────────────────────────────────────────

describe('validateDateIdeas', () => {
  it('validates a correct DateIdeas object', () => {
    expect(validateDateIdeas(validDateIdeas)).toBe(true);
  });

  it('rejects null', () => {
    expect(validateDateIdeas(null)).toBe(false);
  });

  it('rejects empty city', () => {
    expect(validateDateIdeas({ ...validDateIdeas, city: '' })).toBe(false);
  });

  it('rejects non-array ideas', () => {
    expect(validateDateIdeas({ ...validDateIdeas, ideas: 'oops' })).toBe(false);
  });

  it('rejects ideas array with invalid item', () => {
    expect(
      validateDateIdeas({ ...validDateIdeas, ideas: [{ ...validItem, category: 'bad' }] })
    ).toBe(false);
  });

  it('accepts empty ideas array', () => {
    expect(validateDateIdeas({ ...validDateIdeas, ideas: [] })).toBe(true);
  });
});
