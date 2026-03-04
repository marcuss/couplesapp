/**
 * CalendarConnectionCard
 * Displays an active calendar connection with disconnect option.
 * Shows provider info, last sync time, and calendar selection toggles.
 */

import React, { useState } from 'react';
import { CalendarConnectionProps } from '../../../domain/entities/CalendarConnection';

export interface CalendarConnectionCardProps {
  connection: {
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
  };
  onDisconnect: (connectionId: string) => Promise<void>;
  onToggleCalendar: (connectionId: string, calendarId: string) => Promise<void>;
  isDisconnecting?: boolean;
}

const PROVIDER_CONFIG = {
  google: {
    label: 'Google Calendar',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
    accentColor: '#4285F4',
  },
  apple: {
    label: 'Apple Calendar',
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" aria-hidden="true" fill="#1C1C1E">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
    accentColor: '#1C1C1E',
  },
};

function formatLastSync(date?: Date): string {
  if (!date) return 'Nunca sincronizado';
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Hace menos de 1 minuto';
  if (minutes < 60) return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} día${days !== 1 ? 's' : ''}`;
}

export const CalendarConnectionCard: React.FC<CalendarConnectionCardProps> = ({
  connection,
  onDisconnect,
  onToggleCalendar,
  isDisconnecting = false,
}) => {
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [isTogglingCalendar, setIsTogglingCalendar] = useState<string | null>(null);

  const config = PROVIDER_CONFIG[connection.provider];

  const handleDisconnectClick = () => {
    setShowDisconnectConfirm(true);
  };

  const handleConfirmDisconnect = async () => {
    setShowDisconnectConfirm(false);
    await onDisconnect(connection.id);
  };

  const handleToggle = async (calendarId: string) => {
    if (isTogglingCalendar) return;
    setIsTogglingCalendar(calendarId);
    try {
      await onToggleCalendar(connection.id, calendarId);
    } finally {
      setIsTogglingCalendar(null);
    }
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4"
      data-testid={`calendar-connection-card-${connection.provider}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {config.icon}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {config.label}
            </h3>
            {connection.providerAccountEmail && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {connection.providerAccountEmail}
              </p>
            )}
          </div>
        </div>

        {/* Connected badge */}
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          Conectado
        </span>
      </div>

      {/* Last sync info */}
      <p className="text-xs text-gray-400 dark:text-gray-500">
        {formatLastSync(connection.lastSyncedAt)}
      </p>

      {/* Calendar selection */}
      {connection.selectedCalendars.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Calendarios a sincronizar
          </p>
          <div className="space-y-2">
            {connection.selectedCalendars.map((cal) => (
              <label
                key={cal.id}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: cal.color }}
                  aria-hidden="true"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                  {cal.name}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={cal.enabled}
                  aria-label={`${cal.enabled ? 'Desactivar' : 'Activar'} ${cal.name}`}
                  onClick={() => handleToggle(cal.id)}
                  disabled={isTogglingCalendar === cal.id}
                  className={`
                    relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full 
                    border-2 border-transparent transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${cal.enabled ? 'bg-rose-500' : 'bg-gray-300 dark:bg-gray-600'}
                  `}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow
                      transform transition-transform duration-200
                      ${cal.enabled ? 'translate-x-4' : 'translate-x-0'}
                    `}
                  />
                </button>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Disconnect section */}
      {!showDisconnectConfirm ? (
        <button
          type="button"
          onClick={handleDisconnectClick}
          disabled={isDisconnecting}
          className="w-full text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium py-2 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
          aria-label={`Desconectar ${config.label}`}
        >
          {isDisconnecting ? 'Desconectando...' : 'Desconectar'}
        </button>
      ) : (
        <div className="border border-red-200 dark:border-red-800 rounded-lg p-3 space-y-2">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            ¿Seguro? Los eventos importados de {config.label} desaparecerán de CouplePlan.
            Los eventos exportados{' '}
            <strong>NO se eliminan</strong> de tu {config.label}.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirmDisconnect}
              className="flex-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              Sí, desconectar
            </button>
            <button
              type="button"
              onClick={() => setShowDisconnectConfirm(false)}
              className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarConnectionCard;
