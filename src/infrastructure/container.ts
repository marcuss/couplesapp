/**
 * DI Container (Service Container)
 * Wires up all services with their Supabase implementations.
 *
 * Usage in App.tsx:
 *   import { container } from '../infrastructure/container';
 *   <ServiceProvider services={container}> ... </ServiceProvider>
 *
 * In tests, inject mock services instead:
 *   <ServiceProvider services={mockServices}> ... </ServiceProvider>
 */

import { Services } from '../contexts/ServiceContext';
import { SupabaseDashboardService } from './services/SupabaseDashboardService';
import { SupabaseGoalService } from './services/SupabaseGoalService';
import { SupabaseTaskService } from './services/SupabaseTaskService';
import { SupabaseEventService } from './services/SupabaseEventService';
import { SupabaseBudgetService } from './services/SupabaseBudgetService';

export const container: Services = {
  dashboardService: new SupabaseDashboardService(),
  goalService: new SupabaseGoalService(),
  taskService: new SupabaseTaskService(),
  eventService: new SupabaseEventService(),
  budgetService: new SupabaseBudgetService(),
};
