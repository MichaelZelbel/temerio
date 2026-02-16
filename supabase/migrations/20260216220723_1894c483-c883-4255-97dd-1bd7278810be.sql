-- Make remote_base_url nullable for new connections that use env-configured URL
ALTER TABLE public.sync_connections ALTER COLUMN remote_base_url DROP NOT NULL;
ALTER TABLE public.sync_connections ALTER COLUMN remote_base_url SET DEFAULT '';