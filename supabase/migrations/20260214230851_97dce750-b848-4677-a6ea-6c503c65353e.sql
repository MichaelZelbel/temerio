
-- Seed default Person + "Account created" event for each test user

-- Fred
WITH p AS (
  INSERT INTO public.people (user_id, name, relationship_label)
  VALUES ('71eb5bdd-305b-4db8-baac-d860bebf09f4', 'Fred', 'Self')
  RETURNING id
),
e AS (
  INSERT INTO public.events (user_id, date_start, headline_en, description_en, status, confidence_date, confidence_truth, importance, source, verified)
  VALUES ('71eb5bdd-305b-4db8-baac-d860bebf09f4', CURRENT_DATE, 'Account created', 'Created a Temerio account.', 'past_fact', 10, 10, 8, 'manual', true)
  RETURNING id
)
INSERT INTO public.event_participants (event_id, person_id)
SELECT e.id, p.id FROM e, p;

-- Peter
WITH p AS (
  INSERT INTO public.people (user_id, name, relationship_label)
  VALUES ('2d37b978-9a97-4e29-ba39-dfe8aff7be97', 'Peter', 'Self')
  RETURNING id
),
e AS (
  INSERT INTO public.events (user_id, date_start, headline_en, description_en, status, confidence_date, confidence_truth, importance, source, verified)
  VALUES ('2d37b978-9a97-4e29-ba39-dfe8aff7be97', CURRENT_DATE, 'Account created', 'Created a Temerio account.', 'past_fact', 10, 10, 8, 'manual', true)
  RETURNING id
)
INSERT INTO public.event_participants (event_id, person_id)
SELECT e.id, p.id FROM e, p;

-- Alec
WITH p AS (
  INSERT INTO public.people (user_id, name, relationship_label)
  VALUES ('747b5485-d385-4f15-aaed-fef11468a1dc', 'Alec', 'Self')
  RETURNING id
),
e AS (
  INSERT INTO public.events (user_id, date_start, headline_en, description_en, status, confidence_date, confidence_truth, importance, source, verified)
  VALUES ('747b5485-d385-4f15-aaed-fef11468a1dc', CURRENT_DATE, 'Account created', 'Created a Temerio account.', 'past_fact', 10, 10, 8, 'manual', true)
  RETURNING id
)
INSERT INTO public.event_participants (event_id, person_id)
SELECT e.id, p.id FROM e, p;
