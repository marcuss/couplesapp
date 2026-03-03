/**
 * ServiceContext - Dependency Injection container for application services.
 *
 * Usage:
 *   <ServiceProvider services={container}>
 *     <App />
 *   </ServiceProvider>
 *
 * In tests: wrap components with ServiceProvider passing mock services.
 */

import React, { createContext, useContext } from 'react';
import { IDashboardService } from '../application/services/IDashboardService';
import { IGoalService } from '../application/services/IGoalService';
import { ITaskService } from '../application/services/ITaskService';
import { IEventService } from '../application/services/IEventService';
import { IBudgetService } from '../application/services/IBudgetService';

export interface Services {
  dashboardService: IDashboardService;
  goalService: IGoalService;
  taskService: ITaskService;
  eventService: IEventService;
  budgetService: IBudgetService;
}

const ServiceContext = createContext<Services | null>(null);

export interface ServiceProviderProps {
  services: Services;
  children: React.ReactNode;
}

export const ServiceProvider: React.FC<ServiceProviderProps> = ({ services, children }) => {
  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
};

/**
 * Hook to access all application services.
 * Must be used within a <ServiceProvider>.
 */
export function useServices(): Services {
  const ctx = useContext(ServiceContext);
  if (!ctx) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return ctx;
}
