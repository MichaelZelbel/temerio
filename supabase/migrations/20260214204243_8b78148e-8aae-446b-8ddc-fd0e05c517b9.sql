
-- Fix security definer view warning
DROP VIEW IF EXISTS public.v_ai_allowance_current;

CREATE OR REPLACE VIEW public.v_ai_allowance_current
WITH (security_invoker = true)
AS
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
