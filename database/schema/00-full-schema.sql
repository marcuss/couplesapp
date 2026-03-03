-- ============================================================================
-- COUPLEPLAN DATABASE SCHEMA
-- ============================================================================
-- This file contains the complete database schema for reference.
-- WARNING: This is for documentation purposes. Do not run this directly.
-- Use the migration files in /database/migrations/ instead.
-- ============================================================================

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- Stores user profile information, linked to Supabase Auth
-- Primary key 'id' references auth.users(id)
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  partner_id uuid,
  is_premium boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.profiles(id)
);

-- ============================================================================
-- BUDGETS TABLE
-- ============================================================================
-- Stores budget categories and their allocations
-- IMPORTANT: Uses 'created_by' NOT 'user_id' for the owner reference
CREATE TABLE public.budgets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category text NOT NULL,
  amount numeric NOT NULL,
  spent numeric DEFAULT 0,
  year integer DEFAULT EXTRACT(year FROM CURRENT_DATE),
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT budgets_pkey PRIMARY KEY (id),
  CONSTRAINT budgets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- ============================================================================
-- EVENTS TABLE
-- ============================================================================
-- Stores calendar events
-- Uses 'user_id' for the owner reference
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  date date NOT NULL,
  time text,
  type text DEFAULT 'personal'::text CHECK (type = ANY (ARRAY['personal'::text, 'shared'::text])),
  user_id uuid NOT NULL,
  color text DEFAULT '#f43f5e'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- ============================================================================
-- EXPENSES TABLE
-- ============================================================================
-- Stores individual expenses linked to budgets
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  date date DEFAULT CURRENT_DATE,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT expenses_pkey PRIMARY KEY (id),
  CONSTRAINT expenses_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES public.budgets(id),
  CONSTRAINT expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- ============================================================================
-- GOALS TABLE
-- ============================================================================
-- Stores couple goals
-- IMPORTANT: Uses 'created_by' NOT 'user_id' for the owner reference
-- IMPORTANT: Uses 'completed' (boolean) NOT 'status' (text)
CREATE TABLE public.goals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text DEFAULT 'personal'::text CHECK (category = ANY (ARRAY['travel'::text, 'financial'::text, 'personal'::text, 'home'::text, 'other'::text])),
  target_date date,
  completed boolean DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT goals_pkey PRIMARY KEY (id),
  CONSTRAINT goals_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- ============================================================================
-- INVITATIONS TABLE
-- ============================================================================
-- Stores partner invitations
CREATE TABLE public.invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL,
  to_email text NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT invitations_pkey PRIMARY KEY (id),
  CONSTRAINT invitations_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.profiles(id)
);

-- ============================================================================
-- TASKS TABLE
-- ============================================================================
-- Stores tasks/todos
-- IMPORTANT: Uses 'created_by' NOT 'user_id' for the owner reference
-- IMPORTANT: Uses 'completed' (boolean) NOT 'status' (text)
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text DEFAULT 'shared'::text CHECK (category = ANY (ARRAY['home'::text, 'work'::text, 'personal'::text, 'shared'::text])),
  assigned_to uuid,
  due_date date,
  completed boolean DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id),
  CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- ============================================================================
-- TRAVELS TABLE
-- ============================================================================
-- Stores travel plans
CREATE TABLE public.travels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  destination text NOT NULL,
  description text,
  start_date date,
  end_date date,
  estimated_budget numeric,
  status text DEFAULT 'planning'::text CHECK (status = ANY (ARRAY['planning'::text, 'booked'::text, 'completed'::text])),
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT travels_pkey PRIMARY KEY (id),
  CONSTRAINT travels_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
