
-- Create activity_events table
CREATE TABLE public.activity_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id uuid NOT NULL,
  action text NOT NULL,
  item_type text NOT NULL,
  item_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast user lookups
CREATE INDEX idx_activity_events_actor_id ON public.activity_events (actor_id, created_at DESC);
CREATE INDEX idx_activity_events_action ON public.activity_events (action);

-- Enable RLS
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own events
CREATE POLICY "Users view own activity"
  ON public.activity_events
  FOR SELECT
  USING (auth.uid() = actor_id);

-- Users can insert events where they are the actor
CREATE POLICY "Users insert own activity"
  ON public.activity_events
  FOR INSERT
  WITH CHECK (auth.uid() = actor_id);

-- Admins can view all events
CREATE POLICY "Admins view all activity"
  ON public.activity_events
  FOR SELECT
  USING (public.is_admin(auth.uid()));
