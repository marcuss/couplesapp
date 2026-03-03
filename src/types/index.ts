/**
 * TypeScript Type Definitions
 * 
 * IMPORTANT: These types MUST match the database schema.
 * See /database/schema/00-full-schema.sql for reference.
 * 
 * Key conventions:
 * - budgets: uses 'created_by' NOT 'user_id'
 * - goals: uses 'created_by' NOT 'user_id', uses 'completed' (boolean) NOT 'status'
 * - tasks: uses 'created_by' NOT 'user_id', uses 'completed' (boolean) NOT 'status'
 * - events: uses 'user_id' (this one is correct)
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  partnerId?: string;
  createdAt?: string;
}

export interface Profile {
  id: string;
  email: string;
  name?: string;
  partner_id?: string;
  is_premium?: boolean;
  created_at?: string;
}

export interface Invitation {
  id: string;
  from_user_id: string;
  to_email: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  description?: string;
  type?: 'personal' | 'shared';
  color?: string;
  user_id: string;
  created_at?: string;
}

/**
 * Goal - uses 'created_by' NOT 'user_id', uses 'completed' (boolean) NOT 'status'
 */
export interface Goal {
  id: string;
  title: string;
  description?: string;
  category?: 'travel' | 'financial' | 'personal' | 'home' | 'other';
  target_date?: string;
  completed: boolean;
  created_by: string;
  created_at?: string;
}

/**
 * Budget - uses 'created_by' NOT 'user_id'
 */
export interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  year?: number;
  created_by: string;
  created_at?: string;
}

/**
 * Task - uses 'created_by' NOT 'user_id', uses 'completed' (boolean) NOT 'status'
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  category?: 'home' | 'work' | 'personal' | 'shared';
  assigned_to?: string;
  due_date?: string;
  completed: boolean;
  created_by: string;
  created_at?: string;
}

export interface Expense {
  id: string;
  budget_id: string;
  description: string;
  amount: number;
  date?: string;
  created_by: string;
  created_at?: string;
}

export interface TravelPlan {
  id: string;
  destination: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  estimated_budget?: number;
  status: 'planning' | 'booked' | 'completed';
  created_by: string;
  created_at?: string;
}
