/**
 * CalendarConnectionCard Tests — TDD
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { CalendarConnectionCard, CalendarConnectionCardProps } from '../CalendarConnectionCard';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeConnection(
  overrides: Partial<CalendarConnectionCardProps['connection']> = {}
): CalendarConnectionCardProps['connection'] {
  return {
    id: 'conn-001',
    provider: 'google',
    providerAccountEmail: 'user@gmail.com',
    isActive: true,
    selectedCalendars: [
      { id: 'primary', name: 'Personal', color: '#4285F4', enabled: true },
      { id: 'work', name: 'Trabajo', color: '#0F9D58', enabled: false },
    ],
    lastSyncedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    ...overrides,
  };
}

function renderCard(
  connection = makeConnection(),
  props: Partial<CalendarConnectionCardProps> = {}
) {
  const onDisconnect = vi.fn().mockResolvedValue(undefined);
  const onToggleCalendar = vi.fn().mockResolvedValue(undefined);

  const result = render(
    <CalendarConnectionCard
      connection={connection}
      onDisconnect={onDisconnect}
      onToggleCalendar={onToggleCalendar}
      {...props}
    />
  );

  return { ...result, onDisconnect, onToggleCalendar };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('CalendarConnectionCard — rendering', () => {
  it('renders Google Calendar label', () => {
    renderCard();
    expect(screen.getByText('Google Calendar')).toBeInTheDocument();
  });

  it('renders Apple Calendar label for Apple provider', () => {
    renderCard(makeConnection({ provider: 'apple' }));
    expect(screen.getByText('Apple Calendar')).toBeInTheDocument();
  });

  it('renders provider account email', () => {
    renderCard();
    expect(screen.getByText('user@gmail.com')).toBeInTheDocument();
  });

  it('renders "Conectado" badge', () => {
    renderCard();
    expect(screen.getByText('Conectado')).toBeInTheDocument();
  });

  it('renders last sync time', () => {
    renderCard();
    expect(screen.getByText(/hace \d+ minutos?/i)).toBeInTheDocument();
  });

  it('renders "Nunca sincronizado" when no lastSyncedAt', () => {
    renderCard(makeConnection({ lastSyncedAt: undefined }));
    expect(screen.getByText('Nunca sincronizado')).toBeInTheDocument();
  });

  it('renders calendar toggles', () => {
    renderCard();
    const toggles = screen.getAllByRole('switch');
    expect(toggles).toHaveLength(2);
  });

  it('renders calendar names', () => {
    renderCard();
    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('Trabajo')).toBeInTheDocument();
  });

  it('renders "Desconectar" button', () => {
    renderCard();
    expect(screen.getByRole('button', { name: /desconectar google calendar/i })).toBeInTheDocument();
  });

  it('has correct test ID for Google connection', () => {
    renderCard();
    expect(document.querySelector('[data-testid="calendar-connection-card-google"]')).toBeTruthy();
  });

  it('has correct test ID for Apple connection', () => {
    renderCard(makeConnection({ provider: 'apple' }));
    expect(document.querySelector('[data-testid="calendar-connection-card-apple"]')).toBeTruthy();
  });
});

describe('CalendarConnectionCard — disconnect flow', () => {
  it('shows confirmation dialog when Desconectar is clicked', async () => {
    renderCard();
    const disconnectBtn = screen.getByRole('button', { name: /desconectar google calendar/i });
    fireEvent.click(disconnectBtn);

    await waitFor(() => {
      expect(screen.getByText(/¿seguro\?/i)).toBeInTheDocument();
    });
  });

  it('shows two options in the confirmation dialog', async () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: /desconectar google calendar/i }));

    await waitFor(() => {
      expect(screen.getByText(/sí, desconectar/i)).toBeInTheDocument();
      expect(screen.getByText(/cancelar/i)).toBeInTheDocument();
    });
  });

  it('calls onDisconnect with connectionId when confirmed', async () => {
    const { onDisconnect } = renderCard();
    fireEvent.click(screen.getByRole('button', { name: /desconectar google calendar/i }));

    await waitFor(() => {
      expect(screen.getByText(/sí, desconectar/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/sí, desconectar/i));

    await waitFor(() => {
      expect(onDisconnect).toHaveBeenCalledWith('conn-001');
    });
  });

  it('hides confirmation dialog when Cancel is clicked', async () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: /desconectar google calendar/i }));

    await waitFor(() => {
      expect(screen.getByText(/cancelar/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/cancelar/i));

    await waitFor(() => {
      expect(screen.queryByText(/¿seguro\?/i)).not.toBeInTheDocument();
    });
  });

  it('does NOT call onDisconnect when Cancel is clicked', async () => {
    const { onDisconnect } = renderCard();
    fireEvent.click(screen.getByRole('button', { name: /desconectar google calendar/i }));

    await waitFor(() => screen.getByText(/cancelar/i));
    fireEvent.click(screen.getByText(/cancelar/i));

    expect(onDisconnect).not.toHaveBeenCalled();
  });

  it('shows Desconectando... when isDisconnecting prop is true', () => {
    renderCard(makeConnection(), { isDisconnecting: true });
    expect(screen.getByText('Desconectando...')).toBeInTheDocument();
  });

  it('shows the warning about exported events in confirmation', async () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: /desconectar google calendar/i }));

    await waitFor(() => {
      expect(screen.getByText(/no se eliminan/i)).toBeInTheDocument();
    });
  });
});

describe('CalendarConnectionCard — calendar toggles', () => {
  it('shows enabled state for active calendar (aria-checked=true)', () => {
    renderCard();
    const personalToggle = screen.getByRole('switch', { name: /desactivar personal/i });
    expect(personalToggle).toHaveAttribute('aria-checked', 'true');
  });

  it('shows disabled state for inactive calendar (aria-checked=false)', () => {
    renderCard();
    const workToggle = screen.getByRole('switch', { name: /activar trabajo/i });
    expect(workToggle).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onToggleCalendar when toggle is clicked', async () => {
    const { onToggleCalendar } = renderCard();
    const personalToggle = screen.getByRole('switch', { name: /desactivar personal/i });
    fireEvent.click(personalToggle);

    await waitFor(() => {
      expect(onToggleCalendar).toHaveBeenCalledWith('conn-001', 'primary');
    });
  });

  it('does not render calendar section when no calendars', () => {
    renderCard(makeConnection({ selectedCalendars: [] }));
    expect(screen.queryByText(/calendarios a sincronizar/i)).not.toBeInTheDocument();
  });
});
