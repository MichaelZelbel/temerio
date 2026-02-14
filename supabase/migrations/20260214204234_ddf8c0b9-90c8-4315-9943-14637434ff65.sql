
-- 1. ai_credit_settings
CREATE TABLE public.ai_credit_settings (
  key text PRIMARY KEY,
  value_int integer NOT NULL,
  description text
);

ALTER TABLE public.ai_credit_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings"
  ON public.ai_credit_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update settings"
  ON public.ai_credit_settings FOR UPDATE
  USING (public.is_admin(auth.uid()));

INSERT INTO public.ai_credit_settings (key, value_int, description) VALUES
  ('tokens_per_credit', 200, 'Number of tokens equal to one credit'),
  ('credits_free_per_month', 0, 'Monthly credits granted to free-tier users'),
  ('credits_premium_per_month', 1500, 'Monthly credits granted to premium users');

-- 2. ai_allowance_periods
CREATE TABLE public.ai_allowance_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tokens_granted bigint NOT NULL DEFAULT 0,
  tokens_used bigint NOT NULL DEFAULT 0,
  period_start timestamptz NOT NULL DEFAULT date_trunc('month', now()),
  period_end timestamptz NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  source text NOT NULL CHECK (source IN ('subscription', 'free_tier', 'admin_grant')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_allowance_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own allowance"
  ON public.ai_allowance_periods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all allowances"
  ON public.ai_allowance_periods FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins insert allowances"
  ON public.ai_allowance_periods FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins update allowances"
  ON public.ai_allowance_periods FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_ai_allowance_periods_updated_at
  BEFORE UPDATE ON public.ai_allowance_periods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. llm_usage_events
CREATE TABLE public.llm_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  idempotency_key text UNIQUE,
  feature text NOT NULL,
  model text,
  provider text,
  prompt_tokens bigint NOT NULL DEFAULT 0,
  completion_tokens bigint NOT NULL DEFAULT 0,
  total_tokens bigint NOT NULL DEFAULT 0,
  credits_charged numeric NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.llm_usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own usage events"
  ON public.llm_usage_events FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Auto-calculate total_tokens trigger
CREATE OR REPLACE FUNCTION public.calculate_total_tokens()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = public
AS $$
BEGIN
  NEW.total_tokens := COALESCE(NEW.prompt_tokens, 0) + COALESCE(NEW.completion_tokens, 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_calculate_total_tokens
  BEFORE INSERT ON public.llm_usage_events
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_total_tokens();

-- 5. Current allowance view
CREATE OR REPLACE VIEW public.v_ai_allowance_current AS
SELECT
  ap.id,
  ap.user_id,
  ap.tokens_granted,
  ap.tokens_used,
  (ap.tokens_granted - ap.tokens_used) AS remaining_tokens,
  ap.tokens_granted / NULLIF(s.value_int, 0) AS credits_granted,
  ap.tokens_used / NULLIF(s.value_int, 0) AS credits_used,
  (ap.tokens_granted - ap.tokens_used) / NULLIF(s.value_int, 0) AS remaining_credits,
  ap.period_start,
  ap.period_end,
  ap.source,
  ap.metadata
FROM public.ai_allowance_periods ap
CROSS JOIN public.ai_credit_settings s
WHERE s.key = 'tokens_per_credit'
  AND now() >= ap.period_start
  AND now() < ap.period_end;
