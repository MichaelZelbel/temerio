-- Enable pg_net extension for HTTP calls from DB triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Trigger function: notify admin on new user signup via edge function
CREATE OR REPLACE FUNCTION public.notify_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  supabase_url text;
  anon_key text;
BEGIN
  -- Get config from vault or hardcode (using direct values since vault may not be available)
  supabase_url := 'https://xquarhirsodrwzbglxjv.supabase.co';
  anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxdWFyaGlyc29kcnd6YmdseGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTQ3NDMsImV4cCI6MjA4NjY3MDc0M30.kSWtRzctzgrlDEb_UCVCVVhkXrF2aGDb2f00RT8lJ2E';

  -- Fire-and-forget HTTP POST to admin-notify edge function
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/admin-notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
      'event', 'user_registered',
      'userId', NEW.id::text,
      'userEmail', COALESCE(NEW.display_name, 'unknown')
    )
  );

  RETURN NEW;
END;
$$;

-- Attach trigger to profiles table (fires on every new user signup)
CREATE TRIGGER on_profile_created_notify_admin
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_on_signup();
