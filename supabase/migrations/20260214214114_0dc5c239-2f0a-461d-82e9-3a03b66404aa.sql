-- Fix: look up user email from auth.users for the notification
CREATE OR REPLACE FUNCTION public.notify_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  supabase_url text;
  anon_key text;
  user_email text;
BEGIN
  supabase_url := 'https://xquarhirsodrwzbglxjv.supabase.co';
  anon_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxdWFyaGlyc29kcnd6YmdseGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTQ3NDMsImV4cCI6MjA4NjY3MDc0M30.kSWtRzctzgrlDEb_UCVCVVhkXrF2aGDb2f00RT8lJ2E';

  -- Look up email from auth.users (SECURITY DEFINER allows this)
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;

  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/admin-notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
      'event', 'user_registered',
      'userId', NEW.id::text,
      'userEmail', COALESCE(user_email, 'unknown')
    )
  );

  RETURN NEW;
END;
$$;
