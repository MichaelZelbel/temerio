
-- ============================================================
-- People Sync Mapping: Schema Extensions
-- ============================================================

-- 1. Extend people table for merge support
ALTER TABLE public.people
  ADD COLUMN IF NOT EXISTS merged_into_person_id uuid REFERENCES public.people(id),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Index to quickly find non-merged, non-deleted people
CREATE INDEX IF NOT EXISTS idx_people_active
  ON public.people (user_id)
  WHERE merged_into_person_id IS NULL AND deleted_at IS NULL;

-- 2. Extend sync_person_links with status/source/confidence
ALTER TABLE public.sync_person_links
  ADD COLUMN IF NOT EXISTS link_status text NOT NULL DEFAULT 'linked',
  ADD COLUMN IF NOT EXISTS link_source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS confidence numeric;

-- Backfill link_status from is_enabled for existing rows
UPDATE public.sync_person_links
SET link_status = 'excluded'
WHERE is_enabled = false AND link_status = 'linked';

-- Unique constraints: one link per local person per connection, one link per remote uid per connection
CREATE UNIQUE INDEX IF NOT EXISTS uq_sync_person_links_local
  ON public.sync_person_links (user_id, connection_id, local_person_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_sync_person_links_remote
  ON public.sync_person_links (user_id, connection_id, remote_person_uid);

-- 3. Extend sync_conflicts with conflict_type
ALTER TABLE public.sync_conflicts
  ADD COLUMN IF NOT EXISTS conflict_type text NOT NULL DEFAULT 'both_updated';

-- 4. Create sync_person_candidates table
CREATE TABLE IF NOT EXISTS public.sync_person_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid NOT NULL REFERENCES public.sync_connections(id) ON DELETE CASCADE,
  local_person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  remote_person_uid uuid NOT NULL,
  remote_person_name text,
  confidence numeric NOT NULL DEFAULT 0,
  reasons jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sync_person_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own candidates"
  ON public.sync_person_candidates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sync_person_candidates_open
  ON public.sync_person_candidates (user_id, connection_id)
  WHERE status = 'open';

-- 5. Create sync_merge_log table
CREATE TABLE IF NOT EXISTS public.sync_merge_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid REFERENCES public.sync_connections(id),
  entity_type text NOT NULL,
  primary_id uuid NOT NULL,
  merged_id uuid NOT NULL,
  merge_payload jsonb NOT NULL DEFAULT '{}',
  undone_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sync_merge_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own merge logs"
  ON public.sync_merge_log FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at on new tables
CREATE TRIGGER update_sync_person_candidates_updated_at
  BEFORE UPDATE ON public.sync_person_candidates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Also update sync-pull to respect link_status
-- (handled in edge function code, no DB trigger needed)
