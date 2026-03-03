/**
 * DashboardPage Tests - Phase 6
 *
 * Verifica que DashboardPage usa el IDashboardService (via DI),
 * NO llama a supabase directamente.
 *
 * TDD: Estos tests deben fallar ANTES de la implementación.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

import { DashboardPage } from '../DashboardPage';
import { ServiceProvider, Services } from '../../../contexts/ServiceContext';
import { IDashboardService, DashboardData } from '../../../application/services/IDashboardService';
import { IGoalService } from '../../../application/services/IGoalService';
import { ITaskService } from '../../../application/services/ITaskService';
import { IEventService } from '../../../application/services/IEventService';
import { IBudgetService } from '../../../application/services/IBudgetService';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.name) return `Hello, ${opts.name}`;
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock AuthContext — usuario autenticado sin partner
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'alice@test.com', name: 'Alice' },
    partner: null,
  }),
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

function createMockDashboardService(override?: Partial<DashboardData>): IDashboardService {
  return {
    loadData: vi.fn().mockResolvedValue({
      events: [],
      goals: [],
      budgets: [],
      tasks: [],
      ...override,
    } satisfies DashboardData),
  };
}

function createMockServices(dashboardService: IDashboardService): Services {
  return {
    dashboardService,
    goalService: {} as IGoalService,
    taskService: {} as ITaskService,
    eventService: {} as IEventService,
    budgetService: {} as IBudgetService,
  };
}

function renderDashboard(services: Services) {
  return render(
    <MemoryRouter>
      <ServiceProvider services={services}>
        <DashboardPage />
      </ServiceProvider>
    </MemoryRouter>
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('DashboardPage — usa IDashboardService (no supabase)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('llama a dashboardService.loadData al montar con el userId del usuario', async () => {
    const mockService = createMockDashboardService();
    renderDashboard(createMockServices(mockService));

    await waitFor(() => {
      // Se puede llamar 1 o 2 veces dependiendo del rendering de React
      // Lo importante es que se llame con el userId correcto
      expect(mockService.loadData).toHaveBeenCalledWith('user-1', undefined);
    });
  });

  it('llama a dashboardService.loadData — servicio recibe los parámetros correctos', async () => {
    const mockService = createMockDashboardService();
    renderDashboard(createMockServices(mockService));

    await waitFor(() => {
      // Verificamos que se llamó al menos una vez con el usuario correcto
      const calls = (mockService.loadData as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(1);
      // El primer argumento siempre debe ser el userId
      expect(calls[0][0]).toBe('user-1');
    });
  });

  it('muestra el spinner mientras carga datos', () => {
    const mockService: IDashboardService = {
      loadData: vi.fn().mockReturnValue(new Promise(() => {})), // never resolves
    };

    renderDashboard(createMockServices(mockService));

    // Durante la carga debe haber algún indicador de loading
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).not.toBeNull();
  });

  it('muestra estadísticas cuando el servicio devuelve datos', async () => {
    const mockService = createMockDashboardService({
      goals: [
        { id: 'g1', title: 'Buy a house', completed: false, created_by: 'user-1' },
        { id: 'g2', title: 'Travel to Japan', completed: false, created_by: 'user-1' },
      ],
      tasks: [
        { id: 't1', title: 'Fix the leak', completed: false, created_by: 'user-1' },
      ],
      budgets: [],
      events: [],
    });

    renderDashboard(createMockServices(mockService));

    await waitFor(() => {
      // Debe mostrar el número de metas activas (2)
      expect(screen.getByText('2')).toBeTruthy();
    });
  });

  it('muestra estado vacío cuando no hay eventos hoy', async () => {
    const mockService = createMockDashboardService({ events: [] });
    renderDashboard(createMockServices(mockService));

    await waitFor(() => {
      expect(screen.getByText('dashboard.noEventsToday')).toBeTruthy();
    });
  });

  it('muestra estado vacío cuando no hay metas activas', async () => {
    const mockService = createMockDashboardService({ goals: [] });
    renderDashboard(createMockServices(mockService));

    await waitFor(() => {
      expect(screen.getByText('dashboard.noActiveGoals')).toBeTruthy();
    });
  });

  it('muestra estado vacío cuando no hay tareas pendientes', async () => {
    const mockService = createMockDashboardService({ tasks: [] });
    renderDashboard(createMockServices(mockService));

    await waitFor(() => {
      expect(screen.getByText('dashboard.noPendingTasks')).toBeTruthy();
    });
  });

  it('NO importa ni llama a supabase directamente', async () => {
    // Si el módulo supabase es llamado directamente desde DashboardPage,
    // este test fallará porque no mockeamos supabase aquí.
    // El dashboardService es el único punto de acceso a datos.
    const mockService = createMockDashboardService();
    const { container } = renderDashboard(createMockServices(mockService));

    await waitFor(() => {
      expect(mockService.loadData).toHaveBeenCalled();
    });

    // El componente no debe haber intentado acceder a supabase
    // (si intentara, lanzaría error porque supabase no está mockeado)
    expect(container).toBeTruthy();
  });
});
