-- Daily Questions Feature
-- Migration 005: daily_questions schema

-- 1. Questions bank table
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN (
    'communication','intimacy','dreams','memories','values',
    'fun','gratitude','conflict','finances','growth','family','adventure'
  )),
  difficulty int NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  translations jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Daily question assignments (one per couple per day)
CREATE TABLE IF NOT EXISTS public.daily_question_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL,
  question_id uuid NOT NULL REFERENCES public.questions(id),
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(couple_id, date)
);

-- 3. Daily answers (asymmetric reveal)
CREATE TABLE IF NOT EXISTS public.daily_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL,
  question_id uuid NOT NULL REFERENCES public.questions(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  answer text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  answered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(couple_id, user_id, date)
);

-- RLS policies
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_question_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active questions" ON public.questions;
CREATE POLICY "Anyone can read active questions" ON public.questions
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Users can read their couple assignments" ON public.daily_question_assignments;
CREATE POLICY "Users can read their couple assignments" ON public.daily_question_assignments
  FOR SELECT USING (
    couple_id IN (
      SELECT id FROM public.couples
      WHERE partner1_id = auth.uid() OR partner2_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can read own answer always" ON public.daily_answers;
CREATE POLICY "Users can read own answer always" ON public.daily_answers
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own answer" ON public.daily_answers;
CREATE POLICY "Users can insert own answer" ON public.daily_answers
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can read partner answer after both answered" ON public.daily_answers;
CREATE POLICY "Users can read partner answer after both answered" ON public.daily_answers
  FOR SELECT USING (
    -- User can always read their own answer
    user_id = auth.uid()
    OR
    -- User can read partner's answer only after they themselves have answered today
    EXISTS (
      SELECT 1 FROM public.daily_answers da2
      WHERE da2.couple_id = daily_answers.couple_id
        AND da2.user_id = auth.uid()
        AND da2.date = daily_answers.date
    )
  );

-- Function: assign or get today's question for a couple
CREATE OR REPLACE FUNCTION public.get_daily_question(p_couple_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignment daily_question_assignments%ROWTYPE;
  v_question questions%ROWTYPE;
  v_result jsonb;
BEGIN
  -- Get or create today's assignment
  SELECT * INTO v_assignment
  FROM daily_question_assignments
  WHERE couple_id = p_couple_id AND date = CURRENT_DATE;

  IF NOT FOUND THEN
    -- Pick a random question not used by this couple in last 90 days
    SELECT q.* INTO v_question
    FROM questions q
    WHERE q.is_active = true
      AND q.id NOT IN (
        SELECT question_id FROM daily_question_assignments
        WHERE couple_id = p_couple_id
          AND date > CURRENT_DATE - INTERVAL '90 days'
      )
    ORDER BY random()
    LIMIT 1;

    IF NOT FOUND THEN
      -- Fallback: pick any random question
      SELECT * INTO v_question FROM questions WHERE is_active = true ORDER BY random() LIMIT 1;
    END IF;

    INSERT INTO daily_question_assignments(couple_id, question_id, date)
    VALUES (p_couple_id, v_question.id, CURRENT_DATE)
    RETURNING * INTO v_assignment;
  ELSE
    SELECT * INTO v_question FROM questions WHERE id = v_assignment.question_id;
  END IF;

  v_result := jsonb_build_object(
    'question_id', v_question.id,
    'category', v_question.category,
    'difficulty', v_question.difficulty,
    'translations', v_question.translations,
    'date', CURRENT_DATE
  );

  RETURN v_result;
END;
$$;
