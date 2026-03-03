import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Custom storage implementation to avoid LockManager issues
const customStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage errors
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          partner_id: string | null;
          is_premium: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          partner_id?: string | null;
          is_premium?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          partner_id?: string | null;
          is_premium?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          token: string;
          inviter_id: string;
          email: string;
          status: 'pending' | 'accepted' | 'expired';
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          token: string;
          inviter_id: string;
          email: string;
          status?: 'pending' | 'accepted' | 'expired';
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          token?: string;
          inviter_id?: string;
          email?: string;
          status?: 'pending' | 'accepted' | 'expired';
          created_at?: string;
          expires_at?: string | null;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          date: string;
          time: string | null;
          description: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          date: string;
          time?: string | null;
          description?: string | null;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          date?: string;
          time?: string | null;
          description?: string | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      goals: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          target_date: string | null;
          status: 'active' | 'completed' | 'cancelled';
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          target_date?: string | null;
          status?: 'active' | 'completed' | 'cancelled';
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          target_date?: string | null;
          status?: 'active' | 'completed' | 'cancelled';
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          category: string;
          amount: number;
          spent: number;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          amount: number;
          spent?: number;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          amount?: number;
          spent?: number;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          due_date: string | null;
          status: 'pending' | 'in_progress' | 'completed';
          assigned_to: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          due_date?: string | null;
          status?: 'pending' | 'in_progress' | 'completed';
          assigned_to?: string | null;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          status?: 'pending' | 'in_progress' | 'completed';
          assigned_to?: string | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      travel_plans: {
        Row: {
          id: string;
          destination: string;
          start_date: string | null;
          end_date: string | null;
          status: 'planning' | 'booked' | 'completed';
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          destination: string;
          start_date?: string | null;
          end_date?: string | null;
          status?: 'planning' | 'booked' | 'completed';
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          destination?: string;
          start_date?: string | null;
          end_date?: string | null;
          status?: 'planning' | 'booked' | 'completed';
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
