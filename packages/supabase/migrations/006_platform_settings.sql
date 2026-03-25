-- Platform settings for configurable percentages and operations

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id TEXT PRIMARY KEY,
  five_match_pct NUMERIC(5,2) NOT NULL DEFAULT 40,
  four_match_pct NUMERIC(5,2) NOT NULL DEFAULT 35,
  three_match_pct NUMERIC(5,2) NOT NULL DEFAULT 25,
  charity_pct NUMERIC(5,2) NOT NULL DEFAULT 10,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.platform_settings (
  id,
  five_match_pct,
  four_match_pct,
  three_match_pct,
  charity_pct
)
VALUES (
  'default',
  40,
  35,
  25,
  10
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read platform settings" ON public.platform_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage platform settings" ON public.platform_settings
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

GRANT ALL ON TABLE public.platform_settings TO anon, authenticated;
