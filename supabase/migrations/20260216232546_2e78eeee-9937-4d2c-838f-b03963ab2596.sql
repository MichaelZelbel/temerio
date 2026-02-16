
-- Add remote_connection_id to sync_connections so we can make server-to-server calls
ALTER TABLE public.sync_connections
  ADD COLUMN IF NOT EXISTS remote_connection_id uuid;
