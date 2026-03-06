/**
 * DailyQuestionPage Tests (TDD)
 *
 * Verifies DailyQuestionPage uses IDailyQuestionService via DI,
 * and correctly handles all 3 states:
 * 1. Loading
 * 2. Unanswered → shows input form
 * 3. Answered, waiting for partner
 * 4. Both answered → reveal
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

import { DailyQuestionPage } from '../DailyQuestionPage';
import { ServiceProvider, Services } from '../../../contexts/ServiceContext';
import { IDailyQuestionService, DailyQuestionState } from '../../../application/services/IDailyQuestionService';
import { IDashboardService } from '../../../application/services/IDashboardService';
import { IGoalService } from '../../../application/services/IGoalService';
import { ITaskService } from '../../../application/services/ITaskService';
import { IEventService } from '../../../application/services/IEventService';
import { IBudgetService } from '../../../application/services/IBudgetService';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'alice@test.com', name: 'Alice', coupleId: 'couple-1' },
    partner: { id: 'user-2', email: 'bob@test.com', name: 'Bob' },
  }),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const MOCK_QUESTION = {
  questionId: 'q-uuid-1',
  category: 'communication',
  difficulty: 1,
  translations: { en: "What's one thing I do that makes you feel truly heard?" },
  date: '2026-03-05',
};

function createMockDailyQuestionService(
  state: Partial<DailyQuestionState> = {},
  submitResult: { ok: boolean; error?: string } = { ok: true }
): IDailyQuestionService {
  const defaultState: DailyQuestionState = {
    question: MOCK_QUESTION,
    myAnswer: null,
    partnerAnswer: null,
    bothAnswered: false,
    isLoading: false,
    error: null,
    ...state,
  };
  return {
    loadTodayData: vi.fn().mockResolvedValue(defaultState),
    submitAnswer: vi.fn().mockResolvedValue(submitResult),
  };
}

function createMockServices(dailyQuestionService: IDailyQuestionService): Services {
  return {
    dashboardService: {} as IDashboardService,
    goalService: {} as IGoalService,
    taskService: {} as ITaskService,
    eventService: {} as IEventService,
    budgetService: {} as IBudgetService,
    dailyQuestionService,
  };
}

function renderPage(services: Services) {
  return render(
    <MemoryRouter>
      <ServiceProvider services={services}>
        <DailyQuestionPage />
      </ServiceProvider>
    </MemoryRouter>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DailyQuestionPage', () => {
  describe('unanswered state', () => {
    it('displays the daily question', async () => {
      const service = createMockDailyQuestionService();
      renderPage(createMockServices(service));

      await waitFor(() => {
        expect(screen.getByText("What's one thing I do that makes you feel truly heard?")).toBeInTheDocument();
      });
    });

    it('shows the answer text area and submit button', async () => {
      const service = createMockDailyQuestionService();
      renderPage(createMockServices(service));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/share your thoughts/i)).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /share my answer/i })).toBeInTheDocument();
    });

    it('shows the category label', async () => {
      const service = createMockDailyQuestionService();
      renderPage(createMockServices(service));

      await waitFor(() => {
        expect(screen.getByText(/communication/i)).toBeInTheDocument();
      });
    });

    it('calls submitAnswer when user submits the form', async () => {
      const service = createMockDailyQuestionService();
      renderPage(createMockServices(service));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/share your thoughts/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByPlaceholderText(/share your thoughts/i), {
        target: { value: 'When you listen without interrupting.' },
      });

      fireEvent.click(screen.getByRole('button', { name: /share my answer/i }));

      await waitFor(() => {
        expect(service.submitAnswer).toHaveBeenCalledWith(
          'couple-1',
          'q-uuid-1',
          'user-1',
          'When you listen without interrupting.'
        );
      });
    });
  });

  describe('waiting state (answered, partner has not)', () => {
    it('shows the saved answer and waiting message', async () => {
      const service = createMockDailyQuestionService({
        myAnswer: {
          id: 'ans-1', coupleId: 'couple-1', questionId: 'q-uuid-1',
          userId: 'user-1', answer: 'When you put your phone down.',
          date: '2026-03-05', answeredAt: '2026-03-05T10:00:00Z',
        },
        partnerAnswer: null,
        bothAnswered: false,
      });
      renderPage(createMockServices(service));

      await waitFor(() => {
        expect(screen.getByText('When you put your phone down.')).toBeInTheDocument();
      });
      expect(screen.getByText(/waiting for your partner/i)).toBeInTheDocument();
    });

    it('mentions the partner name in the waiting message', async () => {
      const service = createMockDailyQuestionService({
        myAnswer: {
          id: 'ans-1', coupleId: 'couple-1', questionId: 'q-uuid-1',
          userId: 'user-1', answer: 'My answer.',
          date: '2026-03-05', answeredAt: '2026-03-05T10:00:00Z',
        },
        bothAnswered: false,
      });
      renderPage(createMockServices(service));

      await waitFor(() => {
        expect(screen.getByText(/Bob/)).toBeInTheDocument();
      });
    });
  });

  describe('reveal state (both answered)', () => {
    it('shows both answers side by side', async () => {
      const service = createMockDailyQuestionService({
        myAnswer: {
          id: 'ans-1', coupleId: 'couple-1', questionId: 'q-uuid-1',
          userId: 'user-1', answer: "I feel heard when you make eye contact.",
          date: '2026-03-05', answeredAt: '2026-03-05T10:00:00Z',
        },
        partnerAnswer: {
          id: 'ans-2', coupleId: 'couple-1', questionId: 'q-uuid-1',
          userId: 'user-2', answer: "When you repeat back what I said.",
          date: '2026-03-05', answeredAt: '2026-03-05T10:30:00Z',
        },
        bothAnswered: true,
      });
      renderPage(createMockServices(service));

      await waitFor(() => {
        expect(screen.getByText("I feel heard when you make eye contact.")).toBeInTheDocument();
        expect(screen.getByText("When you repeat back what I said.")).toBeInTheDocument();
      });
    });

    it('shows a celebration banner', async () => {
      const service = createMockDailyQuestionService({
        myAnswer: {
          id: 'ans-1', coupleId: 'couple-1', questionId: 'q-uuid-1',
          userId: 'user-1', answer: 'My answer.',
          date: '2026-03-05', answeredAt: '2026-03-05T10:00:00Z',
        },
        partnerAnswer: {
          id: 'ans-2', coupleId: 'couple-1', questionId: 'q-uuid-1',
          userId: 'user-2', answer: 'Partner answer.',
          date: '2026-03-05', answeredAt: '2026-03-05T10:30:00Z',
        },
        bothAnswered: true,
      });
      renderPage(createMockServices(service));

      await waitFor(() => {
        expect(screen.getByText(/you both answered/i)).toBeInTheDocument();
      });
    });
  });

  describe('error state', () => {
    it('displays an error message when service fails', async () => {
      const service = createMockDailyQuestionService({
        question: null,
        error: 'Failed to load daily question',
        isLoading: false,
      });
      renderPage(createMockServices(service));

      await waitFor(() => {
        expect(screen.getByText('Failed to load daily question')).toBeInTheDocument();
      });
    });
  });
});
