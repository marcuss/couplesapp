/**
 * DateIdeasWidget rendering tests
 * Tests collapsed/expanded/feedback/loading/error/empty states
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { DateIdeasWidget } from '../DateIdeasWidget';

// ── Mock hook ────────────────────────────────────────────────────────────────
vi.mock('../../../hooks/useDateIdeas');
import { useDateIdeas } from '../../../hooks/useDateIdeas';

// ── Mock toast ───────────────────────────────────────────────────────────────
vi.mock('sonner', () => ({ toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() } }));

const MOCK_IDEAS = {
  id: 'di-1',
  city: 'Medellín',
  date: '2026-03-04',
  ideas: Array.from({ length: 5 }, (_, i) => ({
    id: `idea-${i}`,
    title: `Idea ${i + 1}`,
    category: 'outdoor' as const,
    description: `Descripción ${i + 1}`,
    estimatedCost: 'low' as const,
    emoji: '🌿',
    timeOfDay: 'afternoon' as const,
    indoorOutdoor: 'outdoor' as const,
    tags: [`tag${i}`],
  })),
  cityNote: 'Nota sobre Medellín',
  generatedAt: '2026-03-04T06:00:00Z',
};

function makeHookResult(overrides = {}) {
  return {
    status: 'loaded',
    ideas: MOCK_IDEAS,
    city: 'Medellín',
    error: null,
    today: '2026-03-04',
    submitFeedback: vi.fn().mockResolvedValue(undefined),
    reload: vi.fn(),
    ...overrides,
  };
}

beforeEach(() => vi.clearAllMocks());

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DateIdeasWidget — collapsed state', () => {
  it('renders the header with city name', () => {
    vi.mocked(useDateIdeas).mockReturnValue(makeHookResult() as ReturnType<typeof useDateIdeas>);
    render(<DateIdeasWidget userId="u1" profileCity="Medellín" />);

    expect(screen.getByTestId('dating-ideas-widget')).toBeInTheDocument();
    expect(screen.getByText(/Medellín/)).toBeInTheDocument();
  });

  it('does not show ideas list when collapsed', () => {
    vi.mocked(useDateIdeas).mockReturnValue(makeHookResult() as ReturnType<typeof useDateIdeas>);
    render(<DateIdeasWidget userId="u1" />);
    expect(screen.queryByTestId('ideas-list')).not.toBeInTheDocument();
  });

  it('expands when header is clicked', () => {
    vi.mocked(useDateIdeas).mockReturnValue(makeHookResult() as ReturnType<typeof useDateIdeas>);
    render(<DateIdeasWidget userId="u1" />);

    fireEvent.click(screen.getByTestId('dating-ideas-toggle'));
    expect(screen.getByTestId('ideas-list')).toBeInTheDocument();
  });
});

describe('DateIdeasWidget — expanded state', () => {
  function renderExpanded() {
    vi.mocked(useDateIdeas).mockReturnValue(makeHookResult() as ReturnType<typeof useDateIdeas>);
    render(<DateIdeasWidget userId="u1" profileCity="Medellín" />);
    fireEvent.click(screen.getByTestId('dating-ideas-toggle'));
  }

  it('shows 3 idea cards initially', () => {
    renderExpanded();
    expect(screen.getAllByTestId('date-idea-card')).toHaveLength(3);
  });

  it('shows "Ver todas" button when there are more than 3 ideas', () => {
    renderExpanded();
    expect(screen.getByTestId('show-more-btn')).toBeInTheDocument();
  });

  it('shows all ideas after clicking "Ver todas"', () => {
    renderExpanded();
    fireEvent.click(screen.getByTestId('show-more-btn'));
    expect(screen.getAllByTestId('date-idea-card')).toHaveLength(5);
  });

  it('shows city note', () => {
    renderExpanded();
    expect(screen.getByText(/Nota sobre Medellín/)).toBeInTheDocument();
  });

  it('shows "No me gustaron" button', () => {
    renderExpanded();
    expect(screen.getByTestId('dislike-btn')).toBeInTheDocument();
  });

  it('toggles back to collapsed on second header click', () => {
    renderExpanded();
    fireEvent.click(screen.getByTestId('dating-ideas-toggle'));
    expect(screen.queryByTestId('ideas-list')).not.toBeInTheDocument();
  });
});

describe('DateIdeasWidget — loading state', () => {
  it('shows loading spinner when detecting city', () => {
    vi.mocked(useDateIdeas).mockReturnValue(
      makeHookResult({ status: 'detecting-city', ideas: null }) as ReturnType<typeof useDateIdeas>
    );
    render(<DateIdeasWidget userId="u1" />);
    fireEvent.click(screen.getByTestId('dating-ideas-toggle'));
    expect(screen.getByText(/Buscando ideas/)).toBeInTheDocument();
  });

  it('shows personalization spinner', () => {
    vi.mocked(useDateIdeas).mockReturnValue(
      makeHookResult({ status: 'personalizing', ideas: null }) as ReturnType<typeof useDateIdeas>
    );
    render(<DateIdeasWidget userId="u1" />);
    fireEvent.click(screen.getByTestId('dating-ideas-toggle'));
    expect(screen.getByText(/personalizadas/)).toBeInTheDocument();
  });
});

describe('DateIdeasWidget — error state', () => {
  it('shows error message and retry button', () => {
    const reload = vi.fn();
    vi.mocked(useDateIdeas).mockReturnValue(
      makeHookResult({ status: 'error', ideas: null, error: 'API error', reload }) as ReturnType<typeof useDateIdeas>
    );
    render(<DateIdeasWidget userId="u1" />);
    fireEvent.click(screen.getByTestId('dating-ideas-toggle'));
    expect(screen.getByText('API error')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Reintentar'));
    expect(reload).toHaveBeenCalledOnce();
  });
});

describe('DateIdeasWidget — empty state', () => {
  it('shows configure city message when no city', () => {
    vi.mocked(useDateIdeas).mockReturnValue(
      makeHookResult({ status: 'empty', ideas: null, city: null }) as ReturnType<typeof useDateIdeas>
    );
    render(<DateIdeasWidget userId="u1" />);
    fireEvent.click(screen.getByTestId('dating-ideas-toggle'));
    expect(screen.getByText(/Configura tu ciudad/)).toBeInTheDocument();
  });

  it('shows no-ideas message when city is set but empty', () => {
    vi.mocked(useDateIdeas).mockReturnValue(
      makeHookResult({ status: 'empty', ideas: null, city: 'Cali' }) as ReturnType<typeof useDateIdeas>
    );
    render(<DateIdeasWidget userId="u1" />);
    fireEvent.click(screen.getByTestId('dating-ideas-toggle'));
    expect(screen.getByText(/No hay ideas disponibles hoy/)).toBeInTheDocument();
  });
});

describe('DateIdeasWidget — feedback flow', () => {
  function renderWithFeedback() {
    const submitFeedback = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useDateIdeas).mockReturnValue(
      makeHookResult({ submitFeedback }) as ReturnType<typeof useDateIdeas>
    );
    render(<DateIdeasWidget userId="u1" profileCity="Medellín" />);
    fireEvent.click(screen.getByTestId('dating-ideas-toggle'));
    fireEvent.click(screen.getByTestId('dislike-btn'));
    return { submitFeedback };
  }

  it('shows feedback form after clicking dislike', () => {
    renderWithFeedback();
    expect(screen.getByTestId('feedback-form')).toBeInTheDocument();
  });

  it('quick chips populate the textarea value', () => {
    renderWithFeedback();
    const chip = screen.getAllByTestId('feedback-chip')[0];
    fireEvent.click(chip);
    const textarea = screen.getByTestId('feedback-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBeTruthy();
  });

  it('submit button is disabled when textarea is empty', () => {
    renderWithFeedback();
    const submitBtn = screen.getByTestId('feedback-submit');
    expect(submitBtn).toBeDisabled();
  });

  it('submits feedback when button is clicked', async () => {
    const { submitFeedback } = renderWithFeedback();
    const textarea = screen.getByTestId('feedback-textarea');
    fireEvent.change(textarea, { target: { value: 'Quiero algo al aire libre' } });

    fireEvent.click(screen.getByTestId('feedback-submit'));

    await waitFor(() => {
      expect(submitFeedback).toHaveBeenCalledWith(
        'u1',
        'Quiero algo al aire libre'
      );
    });
  });

  it('cancel hides the feedback form', () => {
    renderWithFeedback();
    fireEvent.click(screen.getByText('Cancelar'));
    expect(screen.queryByTestId('feedback-form')).not.toBeInTheDocument();
  });
});
