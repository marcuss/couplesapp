/**
 * DateIdeaCard rendering tests
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { DateIdeaCard } from '../DateIdeaCard';
import { DateIdeaItem } from '../../../domain/entities/DateIdea';

const BASE_IDEA: DateIdeaItem = {
  id: 'idea-1',
  title: 'Cena romántica en El Cielo',
  category: 'restaurant',
  description: 'Chef reconocido, experiencia íntima y única',
  estimatedCost: 'medium',
  emoji: '🍝',
  timeOfDay: 'evening',
  indoorOutdoor: 'indoor',
  tags: ['romántico', 'cena', 'íntimo'],
};

describe('DateIdeaCard', () => {
  it('renders card with title', () => {
    render(<DateIdeaCard idea={BASE_IDEA} />);
    expect(screen.getByText('Cena romántica en El Cielo')).toBeInTheDocument();
  });

  it('renders emoji', () => {
    render(<DateIdeaCard idea={BASE_IDEA} />);
    expect(screen.getByText('🍝')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<DateIdeaCard idea={BASE_IDEA} />);
    expect(screen.getByText(/Chef reconocido/)).toBeInTheDocument();
  });

  it('renders cost label for medium', () => {
    render(<DateIdeaCard idea={BASE_IDEA} />);
    expect(screen.getByText('Precio medio')).toBeInTheDocument();
  });

  it('renders cost label for free', () => {
    render(<DateIdeaCard idea={{ ...BASE_IDEA, estimatedCost: 'free' }} />);
    expect(screen.getByText('Gratis')).toBeInTheDocument();
  });

  it('renders cost label for high', () => {
    render(<DateIdeaCard idea={{ ...BASE_IDEA, estimatedCost: 'high' }} />);
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('renders "Interior" for indoor', () => {
    render(<DateIdeaCard idea={BASE_IDEA} />);
    expect(screen.getByText('Interior')).toBeInTheDocument();
  });

  it('renders "Exterior" for outdoor', () => {
    render(<DateIdeaCard idea={{ ...BASE_IDEA, indoorOutdoor: 'outdoor' }} />);
    expect(screen.getByText('Exterior')).toBeInTheDocument();
  });

  it('renders all tags', () => {
    render(<DateIdeaCard idea={BASE_IDEA} />);
    expect(screen.getByText('romántico')).toBeInTheDocument();
    expect(screen.getByText('cena')).toBeInTheDocument();
    expect(screen.getByText('íntimo')).toBeInTheDocument();
  });

  it('does not render tags section when empty', () => {
    const { container } = render(<DateIdeaCard idea={{ ...BASE_IDEA, tags: [] }} />);
    // Tag spans are inside a flex wrapper — verify none rendered
    const tagWrappers = container.querySelectorAll('.flex.flex-wrap.gap-1');
    expect(tagWrappers).toHaveLength(0);
  });

  it('shows time of day when not "any"', () => {
    render(<DateIdeaCard idea={BASE_IDEA} />);
    expect(screen.getByText(/Tarde-noche/)).toBeInTheDocument();
  });

  it('does not show time when timeOfDay is "any"', () => {
    render(<DateIdeaCard idea={{ ...BASE_IDEA, timeOfDay: 'any' }} />);
    expect(screen.queryByText(/Mañana|Tarde|Noche/)).not.toBeInTheDocument();
  });

  it('renders data-testid attribute', () => {
    render(<DateIdeaCard idea={BASE_IDEA} />);
    expect(screen.getByTestId('date-idea-card')).toBeInTheDocument();
  });
});
