-- Add username column to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users (username);

-- Add name column if it doesn't exist
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS name TEXT;
