/**
 * Main App Component
 * Root component with routing and theme provider
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '../design-system/components/ThemeProvider';
import { AuthProvider } from '../contexts/AuthContext';
import { ServiceProvider } from '../contexts/ServiceContext';
import { container } from '../infrastructure/container';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { GoalsPage } from './pages/GoalsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { EventsPage } from './pages/EventsPage';
import { TasksPage } from './pages/TasksPage';
import { InvitationPage } from './pages/InvitationPage';
import { InvitePartnerPage } from './pages/InvitePartnerPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { CalendarSettingsPage } from './pages/CalendarSettingsPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/MainLayout';
import { AuthCallbackPage } from './pages/AuthCallbackPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ServiceProvider services={container}>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/invitation/:token" element={<InvitationPage />} />
            {/* OAuth callback — Supabase redirects here after Google/Apple login */}
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/goals" element={<GoalsPage />} />
                <Route path="/budgets" element={<BudgetsPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/invite" element={<InvitePartnerPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/calendar" element={<CalendarSettingsPage />} />
                <Route path="/auth/google/callback" element={<CalendarSettingsPage />} />
              </Route>
            </Route>

            {/* Redirect root to dashboard or login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
        </ServiceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
