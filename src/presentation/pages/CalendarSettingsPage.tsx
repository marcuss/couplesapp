/**
 * CalendarSettingsPage
 * Allows users to connect/disconnect external calendars (Google, Apple).
 * Located at: /settings/calendar
 *
 * Note: This is a scaffold with mocked connection logic.
 * The real implementation will use ConnectGoogleCalendarUseCase and the Supabase Edge Function.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { GoogleOAuthButton } from '../components/calendar/GoogleOAuthButton';
import { CalendarConnectionCard } from '../components/calendar/CalendarConnectionCard';

export interface MockConnection {
  id: string;
  provider: 'google' | 'apple';
  providerAccountEmail?: string;
  isActive: boolean;
  selectedCalendars: Array<{
    id: string;
    name: string;
    color: string;
    enabled: boolean;
  }>;
  lastSyncedAt?: Date;
}

export const CalendarSettingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Mock state — will be replaced with useCalendarSync hook
  const [connections, setConnections] = useState<MockConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle OAuth callback params (?provider=google&status=success|error)
  useEffect(() => {
    const provider = searchParams.get('provider');
    const status = searchParams.get('status');
    const errorMsg = searchParams.get('error');

    if (provider === 'google' && status === 'success') {
      setSuccessMessage('Google Calendar conectado exitosamente ✓');
      // TODO: Load actual connection from DB via ConnectGoogleCalendarUseCase

      // Mock: add a connection for demo
      setConnections((prev) => {
        const alreadyExists = prev.some((c) => c.provider === 'google');
        if (alreadyExists) return prev;
        return [
          ...prev,
          {
            id: `conn-${Date.now()}`,
            provider: 'google',
            providerAccountEmail: 'usuario@gmail.com',
            isActive: true,
            selectedCalendars: [
              { id: 'primary', name: 'Personal', color: '#4285F4', enabled: true },
              { id: 'work', name: 'Trabajo', color: '#0F9D58', enabled: false },
            ],
            lastSyncedAt: new Date(),
          },
        ];
      });

      // Clean up URL params
      navigate('/settings/calendar', { replace: true });
    } else if (status === 'error') {
      setError(errorMsg ?? 'Error al conectar el calendario. Intenta de nuevo.');
      navigate('/settings/calendar', { replace: true });
    }
  }, [searchParams, navigate]);

  const handleDisconnect = async (connectionId: string) => {
    setIsDisconnecting(connectionId);
    setError(null);

    try {
      // TODO: Call DisconnectCalendarUseCase
      await new Promise((resolve) => setTimeout(resolve, 500)); // simulate API call
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
      setSuccessMessage('Calendario desconectado correctamente.');
    } catch (err) {
      setError('Error al desconectar el calendario. Intenta de nuevo.');
    } finally {
      setIsDisconnecting(null);
    }
  };

  const handleToggleCalendar = async (connectionId: string, calendarId: string) => {
    setConnections((prev) =>
      prev.map((conn) => {
        if (conn.id !== connectionId) return conn;
        return {
          ...conn,
          selectedCalendars: conn.selectedCalendars.map((cal) =>
            cal.id === calendarId ? { ...cal, enabled: !cal.enabled } : cal
          ),
        };
      })
    );
    // TODO: Persist toggle via CalendarConnectionRepository
  };

  const googleConnection = connections.find((c) => c.provider === 'google');
  const appleConnection = connections.find((c) => c.provider === 'apple');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/settings"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Volver a Configuración"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Calendarios externos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sincroniza Google Calendar y Apple Calendar con CouplePlan
          </p>
        </div>
      </div>

      {/* Success message */}
      {successMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm"
        >
          <span className="text-lg" aria-hidden="true">✓</span>
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="ml-auto text-green-600 hover:text-green-800"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
      )}

      {/* Google Calendar Section */}
      <section aria-labelledby="google-calendar-heading">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-500" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="google-calendar-heading"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                Google Calendar
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sincroniza tus eventos de Google con CouplePlan
              </p>
            </div>
          </div>

          {googleConnection ? (
            <CalendarConnectionCard
              connection={googleConnection}
              onDisconnect={handleDisconnect}
              onToggleCalendar={handleToggleCalendar}
              isDisconnecting={isDisconnecting === googleConnection.id}
            />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Conecta tu cuenta de Google para ver y sincronizar tus eventos de Google Calendar
                directamente en CouplePlan.
              </p>
              <GoogleOAuthButton
                onInitiate={() => setError(null)}
                className="w-full justify-center"
              />
            </div>
          )}
        </div>
      </section>

      {/* Apple Calendar Section */}
      <section aria-labelledby="apple-calendar-heading">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            </div>
            <div>
              <h2
                id="apple-calendar-heading"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                Apple Calendar
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sincroniza tu iCloud Calendar con CouplePlan
              </p>
            </div>
          </div>

          {appleConnection ? (
            <CalendarConnectionCard
              connection={appleConnection}
              onDisconnect={handleDisconnect}
              onToggleCalendar={handleToggleCalendar}
              isDisconnecting={isDisconnecting === appleConnection.id}
            />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Disponible en la app de iOS. Usa EventKit para acceder directamente a tu
                iCloud Calendar desde tu iPhone o iPad.
              </p>
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <span className="text-amber-600 dark:text-amber-400 text-sm">
                  📱 Descarga la app de iOS para conectar Apple Calendar
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-it-works-heading">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 space-y-3">
          <h3
            id="how-it-works-heading"
            className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Cómo funciona la sincronización
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="mt-0.5" style={{ color: '#f43f5e' }} aria-hidden="true">●</span>
              <span><strong>CouplePlan</strong>: Eventos creados en esta app</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5" style={{ color: '#4285F4' }} aria-hidden="true">●</span>
              <span><strong>Google Calendar</strong>: Eventos importados desde Google</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-gray-800" aria-hidden="true">●</span>
              <span><strong>Apple Calendar</strong>: Eventos importados desde iCloud (iOS)</span>
            </li>
          </ul>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Los eventos de calendarios externos son de solo lectura en CouplePlan.
            La sincronización ocurre automáticamente cada 15 minutos.
          </p>
        </div>
      </section>
    </div>
  );
};

export default CalendarSettingsPage;
