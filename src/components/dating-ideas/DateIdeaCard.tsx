/**
 * DateIdeaCard
 * Displays a single date idea with its details.
 */

import React from 'react';
import { DateIdeaItem, EstimatedCost } from '../../domain/entities/DateIdea';

interface DateIdeaCardProps {
  idea: DateIdeaItem;
}

const costLabels: Record<EstimatedCost, string> = {
  free: 'Gratis',
  low: 'Económico',
  medium: 'Precio medio',
  high: 'Premium',
};

const costColors: Record<EstimatedCost, string> = {
  free: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export const DateIdeaCard: React.FC<DateIdeaCardProps> = ({ idea }) => {
  return (
    <div
      className="flex gap-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/10 hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-colors"
      data-testid="date-idea-card"
    >
      {/* Emoji */}
      <div className="flex-shrink-0 text-2xl leading-none mt-0.5">{idea.emoji}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white truncate">{idea.title}</p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          <span
            className={`px-1.5 py-0.5 text-xs rounded-full font-medium ${costColors[idea.estimatedCost]}`}
          >
            {costLabels[idea.estimatedCost]}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {idea.indoorOutdoor === 'indoor'
              ? 'Interior'
              : idea.indoorOutdoor === 'outdoor'
              ? 'Exterior'
              : 'Interior/Exterior'}
          </span>
          {idea.timeOfDay !== 'any' && (
            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              ·{' '}
              {idea.timeOfDay === 'morning'
                ? 'Mañana'
                : idea.timeOfDay === 'afternoon'
                ? 'Tarde'
                : idea.timeOfDay === 'evening'
                ? 'Tarde-noche'
                : 'Noche'}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {idea.description}
        </p>

        {/* Tags */}
        {idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {idea.tags.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DateIdeaCard;
