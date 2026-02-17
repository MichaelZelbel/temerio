
-- Cache of remote people fetched from Cherishly
CREATE TABLE public.sync_remote_people_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  connection_id uuid NOT NULL REFERENCES public.sync_connections(id) ON DELETE CASCADE,
  remote_person_uid uuid NOT NULL,
  name text NOT NULL,
  relationship_label text,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(connection_id, remote_person_uid)
);

ALTER TABLE public.sync_remote_people_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own remote people cache"
  ON public.sync_remote_people_cache
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_sync_remote_cache_conn ON public.sync_remote_people_cache(connection_id);
