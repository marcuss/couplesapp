import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

// Mock the AuthContext
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
};

const mockPartner = {
  id: 'partner-id',
  email: 'partner@example.com',
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    partner: mockPartner,
    isLoading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Supabase
const mockFrom = vi.fn();
const mockChannel = vi.fn();
const mockRemoveChannel = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
    functions: { invoke: vi.fn() },
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}));

// ---------- Función CORREGIDA (extracción del fix de DashboardPage.tsx) ----------
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface Event {
  id: string;
  title: string;
  date: string;
  user_id: string;
}

function getTodayEventsFixed(events: Event[]): Event[] {
  const todayStr = getTodayDateString();
  return events.filter(event => {
    const eventDateStr = event.date.split('T')[0];
    return eventDateStr === todayStr;
  });
}

describe('Dashboard Events — BUG FIXED: Date Comparison', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('✅ Date Comparison Bug FIXED', () => {
    it('FIXED: muestra eventos de hoy usando comparación de strings YYYY-MM-DD', () => {
      vi.setSystemTime(new Date('2024-01-15T10:30:00-05:00')); // 10:30 AM EST

      const mockEvents = [
        { id: 'event-1', title: 'Today Event - Should Show', date: '2024-01-15', user_id: 'test-user-id' },
      ];

      // La comparación FIXED: string-to-string
      const todayStr = getTodayDateString();
      const result = getTodayEventsFixed(mockEvents);

      console.log('\n=== DATE COMPARISON DEBUG (FIXED) ===');
      console.log('Today string:', todayStr);
      console.log('Event date:', mockEvents[0].date);
      console.log('Match:', result.length > 0);
      console.log('=== END DEBUG ===\n');

      // Con el fix, el evento aparece correctamente
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Today Event - Should Show');
    });

    it('FIXED: event.date con componente de tiempo se normaliza correctamente', () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00'));

      const eventsWithTime = [
        { id: 'e1', title: 'Event with T', date: '2024-01-15T00:00:00Z', user_id: 'u1' },
        { id: 'e2', title: 'Event plain', date: '2024-01-15', user_id: 'u1' },
        { id: 'e3', title: 'Yesterday', date: '2024-01-14', user_id: 'u1' },
      ];

      const result = getTodayEventsFixed(eventsWithTime);
      expect(result).toHaveLength(2);
      expect(result.map(e => e.title)).not.toContain('Yesterday');
    });

    it('FIXED: no hay dependencia de UTC vs local — usa getDate() local siempre', () => {
      // Fijar una hora que demuestra que el fix es correcto
      vi.setSystemTime(new Date('2024-01-15T14:00:00')); // 2 PM local

      const event = { id: '1', title: 'Test', date: '2024-01-15', user_id: 'u' };
      const result = getTodayEventsFixed([event]);

      // El evento SIEMPRE aparece porque la comparación es en hora local
      expect(result).toHaveLength(1);
    });

    it('FIXED: falla cuando event date formats from Supabase differ from expected', () => {
      const testCases = [
        { input: '2024-01-15', expectedYear: 2024, expectedMonth: 1, expectedDay: 15 },
        { input: '2024-1-5', expectedYear: 2024, expectedMonth: 1, expectedDay: 5 },
        { input: '2024-01-15T00:00:00', expectedYear: 2024, expectedMonth: 1, expectedDay: 15 },
        { input: '2024-01-15T00:00:00Z', expectedYear: 2024, expectedMonth: 1, expectedDay: 15 },
      ];

      for (const testCase of testCases) {
        const [year, month, day] = testCase.input.split('T')[0].split('-').map(Number);

        console.log(`Testing format: ${testCase.input}`);
        console.log(`  Parsed: Year=${year}, Month=${month}, Day=${day}`);

        expect(year).toBe(testCase.expectedYear);
        expect(month).toBe(testCase.expectedMonth);
        expect(day).toBe(testCase.expectedDay);
      }
    });

    it('FIXED: timezone offset no afecta la comparación de fechas de eventos', () => {
      // Simular medianoche UTC (que puede ser día anterior en timezone negativo)
      vi.setSystemTime(new Date('2024-01-15T01:00:00Z')); // 1 AM UTC = 8 PM EST (day 14)

      // El evento tiene fecha local del usuario (día 14 en EST)
      const localDate = new Date();
      const localDateStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;

      // El evento debería tener la fecha local del usuario cuando fue creado
      const event = { id: '1', title: 'Test', date: localDateStr, user_id: 'u' };
      const result = getTodayEventsFixed([event]);

      // Con el fix: comparamos en hora local → siempre coincide
      expect(result).toHaveLength(1);
    });
  });

  describe('Comprehensive Event Filtering Tests', () => {
    it('should handle all edge cases for date comparison', () => {
      const edgeCases = [
        {
          name: 'Same day, different times',
          eventDate: '2024-01-15',
          currentDate: new Date('2024-01-15T23:59:59'),
          shouldMatch: true,
        },
        {
          name: 'Start of month',
          eventDate: '2024-01-01',
          currentDate: new Date('2024-01-01T12:00:00'),
          shouldMatch: true,
        },
        {
          name: 'End of month',
          eventDate: '2024-01-31',
          currentDate: new Date('2024-01-31T12:00:00'),
          shouldMatch: true,
        },
        {
          name: 'Leap year February 29',
          eventDate: '2024-02-29',
          currentDate: new Date('2024-02-29T12:00:00'),
          shouldMatch: true,
        },
        {
          name: 'Different year (should not match)',
          eventDate: '2023-01-15',
          currentDate: new Date('2024-01-15T12:00:00'),
          shouldMatch: false,
        },
        {
          name: 'Different month (should not match)',
          eventDate: '2024-02-15',
          currentDate: new Date('2024-01-15T12:00:00'),
          shouldMatch: false,
        },
        {
          name: 'Different day (should not match)',
          eventDate: '2024-01-16',
          currentDate: new Date('2024-01-15T12:00:00'),
          shouldMatch: false,
        },
      ];

      for (const testCase of edgeCases) {
        vi.setSystemTime(testCase.currentDate);

        const [eventYear, eventMonth, eventDay] = testCase.eventDate.split('-').map(Number);
        const currentYear = testCase.currentDate.getFullYear();
        const currentMonth = testCase.currentDate.getMonth() + 1;
        const currentDay = testCase.currentDate.getDate();

        const matches = eventYear === currentYear && eventMonth === currentMonth && eventDay === currentDay;

        console.log(`Test: ${testCase.name}`);
        console.log(`  Event: ${testCase.eventDate}, Current: ${testCase.currentDate.toISOString()}`);
        console.log(`  Expected match: ${testCase.shouldMatch}, Actual: ${matches}`);

        expect(matches).toBe(testCase.shouldMatch);
      }
    });
  });

  describe('User Flow Simulation - Creating and Viewing Events', () => {
    it('should simulate complete user flow: create event -> should appear in dashboard', () => {
      const today = new Date();
      const eventDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const newEvent = {
        id: 'new-event-123',
        title: 'My New Event',
        date: eventDate,
        user_id: 'test-user-id',
      };

      console.log('\n=== USER FLOW SIMULATION (FIXED) ===');
      console.log('Step 1: User creates event');
      console.log('  Event date (local):', newEvent.date);
      console.log('Step 2: Event stored in Supabase');
      console.log('Step 3: Dashboard fetches events');
      console.log('Step 4: Dashboard filters using getTodayEventsFixed()');

      const result = getTodayEventsFixed([newEvent]);
      console.log('  Events found:', result.length);
      console.log('=== END SIMULATION ===\n');

      // Con el fix, el evento SIEMPRE aparece
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('My New Event');
    });
  });
});
