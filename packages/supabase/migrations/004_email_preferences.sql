-- Email preferences for user profiles

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_draw_results BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS email_marketing BOOLEAN NOT NULL DEFAULT FALSE;
