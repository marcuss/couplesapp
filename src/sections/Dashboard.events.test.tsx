import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
  },
}));

describe('Dashboard Events Bug - Production Environment Simulation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Date Comparison Bug in Production', () => {
    it('should fail to show events when Supabase returns UTC dates', async () => {
      // This test simulates the production scenario where:
      // 1. Supabase stores dates in UTC
      // 2. The dashboard filters events using local date
      // 3. The mismatch causes events to not appear

      // Set system time to a specific date for consistent testing
      const testDate = new Date('2024-01-15T10:30:00-05:00'); // 10:30 AM EST
      vi.setSystemTime(testDate);

      // Simulate Supabase returning events with UTC timestamps
      // In production, Supabase stores: '2024-01-15' (UTC date)
      // But the local date might be '2024-01-14' depending on timezone
      const mockEvents = [
        {
          id: 'event-1',
          title: 'Today Event - Should Show',
          date: '2024-01-15', // UTC date from Supabase
          time: '14:00',
          user_id: 'test-user-id',
          created_at: '2024-01-15T14:00:00Z',
        },
      ];

      // Mock Supabase response
      mockFrom.mockImplementation((table: string) => {
        if (table === 'events') {
          return {
            select: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: mockEvents,
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      // Simulate the dashboard filtering logic (buggy version)
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // 0-indexed, so January = 1
      const currentDay = currentDate.getDate();

      // The event date from Supabase (UTC)
      const eventDate = mockEvents[0].date; // '2024-01-15'
      const [eventYear, eventMonth, eventDay] = eventDate.split('-').map(Number);

      // Log the comparison for debugging
      console.log('\n=== DATE COMPARISON DEBUG ===');
      console.log('Current Date (Local):', currentDate.toString());
      console.log('Current Year:', currentYear);
      console.log('Current Month:', currentMonth);
      console.log('Current Day:', currentDay);
      console.log('Event Date (from Supabase):', eventDate);
      console.log('Event Year:', eventYear);
      console.log('Event Month:', eventMonth);
      console.log('Event Day:', eventDay);

      // The comparison that happens in Dashboard.tsx
      const isTodayEvent = 
        eventYear === currentYear && 
        eventMonth === currentMonth && 
        eventDay === currentDay;

      console.log('Is Today Event?:', isTodayEvent);
      console.log('=== END DEBUG ===\n');

      // This assertion documents the expected behavior
      // In production, this might fail due to timezone issues
      expect(isTodayEvent).toBe(true);

      // But let's also test edge cases that cause the bug
      // Edge Case 1: Date stored as UTC but compared in local time
      const utcDate = new Date('2024-01-15T00:00:00Z'); // Midnight UTC
      const localDate = new Date('2024-01-14T19:00:00-05:00'); // 7 PM EST (same moment)
      
      console.log('UTC Date:', utcDate.toISOString());
      console.log('Local Date:', localDate.toString());
      console.log('UTC Day:', utcDate.getUTCDate());
      console.log('Local Day:', localDate.getDate());

      // The bug: If we compare UTC day with local day, they differ!
      const utcDay = utcDate.getUTCDate();
      const localDay = localDate.getDate();
      
      // This might fail in production depending on timezone
      expect(utcDay).toBe(localDay);
    });

    it('should fail when event date format from Supabase differs from expected', async () => {
      // Test various date formats that might come from Supabase
      const testCases = [
        { input: '2024-01-15', expectedYear: 2024, expectedMonth: 1, expectedDay: 15 },
        { input: '2024-1-5', expectedYear: 2024, expectedMonth: 1, expectedDay: 5 }, // No leading zeros
        { input: '2024-01-15T00:00:00', expectedYear: 2024, expectedMonth: 1, expectedDay: 15 }, // With time
        { input: '2024-01-15T00:00:00Z', expectedYear: 2024, expectedMonth: 1, expectedDay: 15 }, // ISO format
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

    it('should demonstrate the actual production bug with timezone offset', async () => {
      // This test specifically targets the production bug
      // where events created "today" don't show in the dashboard

      // Simulate being in a negative timezone (e.g., EST -05:00)
      const originalTimezoneOffset = Date.prototype.getTimezoneOffset;
      
      // Mock timezone offset to be EST (300 minutes = 5 hours behind UTC)
      Date.prototype.getTimezoneOffset = vi.fn().mockReturnValue(300);

      // Set time to just after midnight UTC (which is previous day in EST)
      const lateNightUTC = new Date('2024-01-15T01:00:00Z'); // 1 AM UTC = 8 PM EST (previous day)
      vi.setSystemTime(lateNightUTC);

      // Event stored in Supabase with UTC date
      const eventFromSupabase = {
        date: '2024-01-15', // This is the UTC date
      };

      // Dashboard filtering logic
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const currentDay = currentDate.getDate();

      const [eventYear, eventMonth, eventDay] = eventFromSupabase.date.split('-').map(Number);

      console.log('\n=== TIMEZONE BUG DEMONSTRATION ===');
      console.log('System Time (Local):', currentDate.toString());
      console.log('System Time (ISO):', currentDate.toISOString());
      console.log('Current Year (local):', currentYear);
      console.log('Current Month (local):', currentMonth);
      console.log('Current Day (local):', currentDay);
      console.log('Event Year:', eventYear);
      console.log('Event Month:', eventMonth);
      console.log('Event Day:', eventDay);

      // The comparison
      const matches = eventYear === currentYear && eventMonth === currentMonth && eventDay === currentDay;
      console.log('Date matches?:', matches);
      console.log('=== END DEMONSTRATION ===\n');

      // Restore original method
      Date.prototype.getTimezoneOffset = originalTimezoneOffset;

      // In this scenario, the event date (15th UTC) doesn't match local date (14th EST)
      // This is the root cause of the production bug!
      expect(matches).toBe(true); // This will FAIL, proving the bug exists
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
    it('should simulate complete user flow: create event -> should appear in dashboard', async () => {
      // Step 1: User creates an event for today
      const today = new Date();
      const eventDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const newEvent = {
        id: 'new-event-123',
        title: 'My New Event',
        date: eventDate,
        time: '14:00',
        user_id: 'test-user-id',
      };

      console.log('\n=== USER FLOW SIMULATION ===');
      console.log('Step 1: User creates event');
      console.log('  Event date:', newEvent.date);
      console.log('  Current date (local):', today.toString());
      console.log('  Current date (ISO):', today.toISOString());

      // Step 2: Event is stored in Supabase
      console.log('Step 2: Event stored in Supabase');

      // Step 3: Dashboard fetches events
      console.log('Step 3: Dashboard fetches events');

      // Step 4: Dashboard filters for today's events
      const [eventYear, eventMonth, eventDay] = newEvent.date.split('-').map(Number);
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      const currentDay = today.getDate();

      const isTodayEvent = eventYear === currentYear && eventMonth === currentMonth && eventDay === currentDay;

      console.log('Step 4: Dashboard filters events');
      console.log('  Event year/month/day:', eventYear, eventMonth, eventDay);
      console.log('  Current year/month/day:', currentYear, currentMonth, currentDay);
      console.log('  Is today event?:', isTodayEvent);
      console.log('=== END SIMULATION ===\n');

      // The event SHOULD appear in the dashboard
      expect(isTodayEvent).toBe(true);

      // But in production, due to timezone issues, this might fail
      // This test documents the expected behavior
    });
  });
});
