
-- =============================================================
-- PHASE 1: Rename events→moments, importance→impact_level, sync tables
-- =============================================================

-- 1. Add new columns to events before rename
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS moment_uid uuid UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS person_id uuid REFERENCES public.people(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS impact_level integer,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS attachments jsonb;

-- 2. Backfill moment_uid for existing rows
UPDATE public.events SET moment_uid = gen_random_uuid() WHERE moment_uid IS NULL;
ALTER TABLE public.events ALTER COLUMN moment_uid SET NOT NULL;

-- 3. Migrate importance (1-10) → impact_level (1-4)
UPDATE public.events SET impact_level = CASE
  WHEN importance BETWEEN 1 AND 3 THEN 1
  WHEN importance BETWEEN 4 AND 6 THEN 2
  WHEN importance BETWEEN 7 AND 8 THEN 3
  WHEN importance BETWEEN 9 AND 10 THEN 4
  ELSE 2
END;
ALTER TABLE public.events ALTER COLUMN impact_level SET NOT NULL;
ALTER TABLE public.events ALTER COLUMN impact_level SET DEFAULT 2;
ALTER TABLE public.events ADD CONSTRAINT events_impact_level_check CHECK (impact_level BETWEEN 1 AND 4);
ALTER TABLE public.events DROP COLUMN importance;

-- 4. Rename columns
ALTER TABLE public.events RENAME COLUMN headline_en TO title;
ALTER TABLE public.events RENAME COLUMN description_en TO description;
ALTER TABLE public.events RENAME COLUMN date_start TO happened_at;
ALTER TABLE public.events RENAME COLUMN date_end TO happened_end;

-- 5. Convert happened_at/happened_end from date → timestamptz
ALTER TABLE public.events ALTER COLUMN happened_at TYPE timestamptz USING happened_at::timestamptz;
ALTER TABLE public.events ALTER COLUMN happened_end TYPE timestamptz USING happened_end::timestamptz;

-- 6. Rename table events → moments
ALTER TABLE public.events RENAME TO moments;

-- 7. Rename event_participants → moment_participants
ALTER TABLE public.event_participants RENAME TO moment_participants;
ALTER TABLE public.moment_participants RENAME COLUMN event_id TO moment_id;

-- 8. Rename event_provenance → moment_provenance
ALTER TABLE public.event_provenance RENAME TO moment_provenance;
ALTER TABLE public.moment_provenance RENAME COLUMN event_id TO moment_id;

-- 9. Rename event_id → moment_id in review_queue
ALTER TABLE public.review_queue RENAME COLUMN event_id TO moment_id;

-- 10. Add person_uid to people
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS person_uid uuid UNIQUE DEFAULT gen_random_uuid();
UPDATE public.people SET person_uid = gen_random_uuid() WHERE person_uid IS NULL;
ALTER TABLE public.people ALTER COLUMN person_uid SET NOT NULL;

-- 11. Drop old RLS policies on moments (formerly events)
DROP POLICY IF EXISTS "Users delete own events" ON public.moments;
DROP POLICY IF EXISTS "Users insert own events" ON public.moments;
DROP POLICY IF EXISTS "Users update own events" ON public.moments;
DROP POLICY IF EXISTS "Users view own events" ON public.moments;

CREATE POLICY "Users delete own moments" ON public.moments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own moments" ON public.moments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own moments" ON public.moments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users view own moments" ON public.moments FOR SELECT USING (auth.uid() = user_id);

-- 12. Drop old RLS on moment_participants
DROP POLICY IF EXISTS "Users manage own event participants" ON public.moment_participants;
CREATE POLICY "Users manage own moment participants" ON public.moment_participants FOR ALL
  USING (EXISTS (SELECT 1 FROM public.moments WHERE moments.id = moment_participants.moment_id AND moments.user_id = auth.uid()));

-- 13. Drop old RLS on moment_provenance
DROP POLICY IF EXISTS "Users delete own provenance" ON public.moment_provenance;
DROP POLICY IF EXISTS "Users insert own provenance" ON public.moment_provenance;
DROP POLICY IF EXISTS "Users view own provenance" ON public.moment_provenance;
DROP POLICY IF EXISTS "Users can delete own event provenance" ON public.moment_provenance;

CREATE POLICY "Users delete own provenance" ON public.moment_provenance FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own provenance" ON public.moment_provenance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own provenance" ON public.moment_provenance FOR SELECT USING (auth.uid() = user_id);

-- 14. Sync tables

CREATE TABLE public.sync_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  remote_app text NOT NULL CHECK (remote_app IN ('cherishly', 'temerio')),
  remote_base_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  shared_secret_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sync_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sync connections" ON public.sync_connections FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.sync_pairing_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sync_pairing_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pairing codes" ON public.sync_pairing_codes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.sync_person_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid NOT NULL REFERENCES public.sync_connections(id) ON DELETE CASCADE,
  local_person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  remote_person_uid uuid NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sync_person_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own person links" ON public.sync_person_links FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.sync_outbox (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL,
  connection_id uuid NOT NULL REFERENCES public.sync_connections(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('person', 'moment')),
  entity_uid uuid NOT NULL,
  operation text NOT NULL CHECK (operation IN ('upsert', 'delete')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  delivery_attempts integer NOT NULL DEFAULT 0
);
ALTER TABLE public.sync_outbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own outbox" ON public.sync_outbox FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE public.sync_cursors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid NOT NULL REFERENCES public.sync_connections(id) ON DELETE CASCADE,
  last_pulled_outbox_id bigint NOT NULL DEFAULT 0,
  last_pushed_outbox_id bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, connection_id)
);
ALTER TABLE public.sync_cursors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cursors" ON public.sync_cursors FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.sync_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid NOT NULL REFERENCES public.sync_connections(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_uid uuid NOT NULL,
  local_payload jsonb NOT NULL,
  remote_payload jsonb NOT NULL,
  resolved_at timestamptz,
  resolution text CHECK (resolution IN ('local', 'remote')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sync_conflicts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own conflicts" ON public.sync_conflicts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 15. Updated_at triggers for sync tables
CREATE TRIGGER update_sync_connections_updated_at BEFORE UPDATE ON public.sync_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sync_person_links_updated_at BEFORE UPDATE ON public.sync_person_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sync_cursors_updated_at BEFORE UPDATE ON public.sync_cursors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure moments table has updated_at trigger
DROP TRIGGER IF EXISTS update_events_updated_at ON public.moments;
DROP TRIGGER IF EXISTS update_moments_updated_at ON public.moments;
CREATE TRIGGER update_moments_updated_at BEFORE UPDATE ON public.moments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
