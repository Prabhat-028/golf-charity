-- Browser push notification preference on profiles

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS push_results_enabled BOOLEAN NOT NULL DEFAULT FALSE;
