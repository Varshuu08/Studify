-- Supabase migration: add task_xp, history, decay_rate, badges to users
-- Run with psql or via Supabase SQL editor

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS task_xp jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS history jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS decay_rate numeric DEFAULT 0.2,
  ADD COLUMN IF NOT EXISTS badges jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS schedule jsonb DEFAULT '[]'::jsonb;

-- Optional: create a small index on users -> history if you plan queries
-- CREATE INDEX IF NOT EXISTS idx_users_history ON public.users USING gin (history jsonb_path_ops);
