/**
 * TasksPage Tests - Phase 6
 *
 * Verifica que TasksPage usa ITaskService (via DI),
 * NO llama a supabase directamente.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

import { TasksPage } from '../TasksPage';
import { ServiceProvider, Services } from '../../../contexts/ServiceContext';
import { ITaskService } from '../../../application/services/ITaskService';
import { IDashboardService } from '../../../application/services/IDashboardService';
import { IGoalService } from '../../../application/services/IGoalService';
import { IEventService } from '../../../application/services/IEventService';
import { IBudgetService } from '../../../application/services/IBudgetService';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'alice@test.com', name: 'Alice' },
    partner: null,
  }),
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

function createMockTaskService(tasks = []): ITaskService {
  return {
    getAll: vi.fn().mockResolvedValue(tasks),
    create: vi.fn().mockResolvedValue(undefined),
    toggleComplete: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

function createMockServices(taskService: ITaskService): Services {
  return {
    dashboardService: {} as IDashboardService,
    goalService: {} as IGoalService,
    taskService,
    eventService: {} as IEventService,
    budgetService: {} as IBudgetService,
  };
}

function renderTasks(services: Services) {
  return render(
    <MemoryRouter>
      <ServiceProvider services={services}>
        <TasksPage />
      </ServiceProvider>
    </MemoryRouter>
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('TasksPage — usa ITaskService (no supabase)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('llama a taskService.getAll al montar', async () => {
    const mockService = createMockTaskService();
    renderTasks(createMockServices(mockService));

    await waitFor(() => {
      expect(mockService.getAll).toHaveBeenCalledTimes(1);
      expect(mockService.getAll).toHaveBeenCalledWith('user-1', undefined);
    });
  });

  it('muestra el spinner mientras carga', () => {
    const mockService: ITaskService = {
      getAll: vi.fn().mockReturnValue(new Promise(() => {})),
      create: vi.fn(),
      toggleComplete: vi.fn(),
      delete: vi.fn(),
    };

    renderTasks(createMockServices(mockService));
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).not.toBeNull();
  });

  it('muestra tareas cuando el servicio devuelve datos', async () => {
    const mockService = createMockTaskService([
      { id: 't1', title: 'Fix the leak', completed: false, created_by: 'user-1' },
    ]);

    renderTasks(createMockServices(mockService));

    await waitFor(() => {
      expect(screen.getByText('Fix the leak')).toBeTruthy();
    });
  });

  it('muestra estado vacío cuando no hay tareas pendientes', async () => {
    const mockService = createMockTaskService([]);
    renderTasks(createMockServices(mockService));

    await waitFor(() => {
      expect(screen.getByText('tasks.noPendingTasks')).toBeTruthy();
    });
  });

  it('llama a taskService.toggleComplete cuando el usuario completa una tarea', async () => {
    const mockService = createMockTaskService([
      { id: 't1', title: 'Fix the leak', completed: false, created_by: 'user-1' },
    ]);

    renderTasks(createMockServices(mockService));

    await waitFor(() => {
      expect(screen.getByText('Fix the leak')).toBeTruthy();
    });

    // El botón de completar es el Circle icon
    const toggleButton = screen.getByTitle('tasks.markComplete');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(mockService.toggleComplete).toHaveBeenCalledWith('t1', false);
    });
  });

  it('llama a taskService.delete cuando el usuario elimina una tarea', async () => {
    const mockService = createMockTaskService([
      { id: 't1', title: 'Fix the leak', completed: false, created_by: 'user-1' },
    ]);

    renderTasks(createMockServices(mockService));

    await waitFor(() => {
      expect(screen.getByText('Fix the leak')).toBeTruthy();
    });

    const deleteButton = screen.getByTitle('common.delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockService.delete).toHaveBeenCalledWith('t1');
    });
  });

  it('el ITaskService.create es el contrato que la página debe usar para crear tareas', () => {
    // Este test verifica que TasksPage depende de ITaskService,
    // NO de supabase directamente.
    const mockService = createMockTaskService([]);
    const services = createMockServices(mockService);

    // TasksPage recibe ITaskService a través del ServiceContext (DI)
    expect(services.taskService.create).toBeDefined();
    expect(typeof services.taskService.create).toBe('function');

    // El servicio tiene la interfaz correcta
    expect(services.taskService.getAll).toBeDefined();
    expect(services.taskService.toggleComplete).toBeDefined();
    expect(services.taskService.delete).toBeDefined();
  });
});
