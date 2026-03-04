-- FASE 1: Dating Ideas migration
-- Agregar campo city al profile
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city_updated_at TIMESTAMPTZ;

-- Ideas de citas por ciudad y fecha
CREATE TABLE IF NOT EXISTS date_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  ideas JSONB NOT NULL, -- array de ideas estructuradas
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(city, date)
);

-- Feedback de usuarios sobre sugerencias
CREATE TABLE IF NOT EXISTS date_ideas_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  feedback_text TEXT,          -- "prefiero cosas al aire libre" etc.
  personalized_ideas JSONB,    -- ideas personalizadas generadas tras el feedback
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE date_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_ideas_feedback ENABLE ROW LEVEL SECURITY;

-- date_ideas: cualquier usuario autenticado puede leer
CREATE POLICY "authenticated users can read date_ideas"
  ON date_ideas FOR SELECT TO authenticated USING (true);

-- date_ideas_feedback: cada usuario solo ve/crea el suyo
CREATE POLICY "users manage own feedback"
  ON date_ideas_feedback FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
