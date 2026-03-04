/**
 * DateIdea Domain Entities
 * Core types for the Dating Ideas feature
 */

export type DateIdeaCategory =
  | 'restaurant'
  | 'concert'
  | 'outdoor'
  | 'cultural'
  | 'sport'
  | 'entertainment'
  | 'romantic'
  | 'adventure'
  | 'art'
  | 'other';

export type EstimatedCost = 'free' | 'low' | 'medium' | 'high';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'any';
export type IndoorOutdoor = 'indoor' | 'outdoor' | 'both';

export interface DateIdeaItem {
  id: string;
  title: string;
  category: DateIdeaCategory;
  description: string;
  estimatedCost: EstimatedCost;
  emoji: string;
  timeOfDay: TimeOfDay;
  indoorOutdoor: IndoorOutdoor;
  tags: string[];
}

export interface DateIdeas {
  id: string;
  city: string;
  date: string; // YYYY-MM-DD
  ideas: DateIdeaItem[];
  cityNote: string;
  generatedAt: string;
}

export interface DateIdeasFeedback {
  id: string;
  userId: string;
  city: string;
  date: string;
  feedbackText: string;
  personalizedIdeas?: DateIdeaItem[];
  createdAt: string;
}

/** Validation helpers */
const VALID_CATEGORIES: DateIdeaCategory[] = [
  'restaurant', 'concert', 'outdoor', 'cultural', 'sport',
  'entertainment', 'romantic', 'adventure', 'art', 'other',
];
const VALID_COSTS: EstimatedCost[] = ['free', 'low', 'medium', 'high'];
const VALID_TIME_OF_DAY: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night', 'any'];
const VALID_INDOOR_OUTDOOR: IndoorOutdoor[] = ['indoor', 'outdoor', 'both'];

export function isValidCategory(v: unknown): v is DateIdeaCategory {
  return VALID_CATEGORIES.includes(v as DateIdeaCategory);
}

export function isValidCost(v: unknown): v is EstimatedCost {
  return VALID_COSTS.includes(v as EstimatedCost);
}

export function isValidTimeOfDay(v: unknown): v is TimeOfDay {
  return VALID_TIME_OF_DAY.includes(v as TimeOfDay);
}

export function isValidIndoorOutdoor(v: unknown): v is IndoorOutdoor {
  return VALID_INDOOR_OUTDOOR.includes(v as IndoorOutdoor);
}

export function validateDateIdeaItem(item: unknown): item is DateIdeaItem {
  if (!item || typeof item !== 'object') return false;
  const i = item as Record<string, unknown>;
  return (
    typeof i.id === 'string' && i.id.length > 0 &&
    typeof i.title === 'string' && i.title.length > 0 &&
    isValidCategory(i.category) &&
    typeof i.description === 'string' &&
    isValidCost(i.estimatedCost) &&
    typeof i.emoji === 'string' &&
    isValidTimeOfDay(i.timeOfDay) &&
    isValidIndoorOutdoor(i.indoorOutdoor) &&
    Array.isArray(i.tags)
  );
}

export function validateDateIdeas(obj: unknown): obj is DateIdeas {
  if (!obj || typeof obj !== 'object') return false;
  const d = obj as Record<string, unknown>;
  return (
    typeof d.id === 'string' &&
    typeof d.city === 'string' && d.city.length > 0 &&
    typeof d.date === 'string' &&
    Array.isArray(d.ideas) &&
    (d.ideas as unknown[]).every(validateDateIdeaItem) &&
    typeof d.cityNote === 'string'
  );
}
