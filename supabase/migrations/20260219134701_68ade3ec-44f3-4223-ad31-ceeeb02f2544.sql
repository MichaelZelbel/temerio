
-- Create enqueue_moment_sync trigger function
-- Writes moment changes to sync_outbox for all active connections belonging to this user
CREATE OR REPLACE FUNCTION public.enqueue_moment_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conn RECORD;
  op   TEXT;
  payload JSONB;
  affected_user_id UUID;
  affected_moment_uid UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    affected_user_id   := OLD.user_id;
    affected_moment_uid := OLD.moment_uid;
    op      := 'delete';
    payload := jsonb_build_object(
      'moment_uid', OLD.moment_uid,
      'updated_at', now()
    );
  ELSE
    affected_user_id   := NEW.user_id;
    affected_moment_uid := NEW.moment_uid;
    op      := 'upsert';
    payload := jsonb_build_object(
      'moment_uid',   NEW.moment_uid,
      'title',        NEW.title,
      'description',  NEW.description,
      'happened_at',  NEW.happened_at,
      'happened_end', NEW.happened_end,
      'impact_level', NEW.impact_level,
      'category',     NEW.category,
      'status',       NEW.status,
      'attachments',  NEW.attachments,
      'person_uid',   (SELECT person_uid FROM public.people WHERE id = NEW.person_id),
      'updated_at',   NEW.updated_at
    );
  END IF;

  FOR conn IN
    SELECT id FROM public.sync_connections
    WHERE user_id = affected_user_id AND status = 'active'
  LOOP
    INSERT INTO public.sync_outbox
      (connection_id, user_id, entity_type, entity_uid, operation, payload)
    VALUES
      (conn.id, affected_user_id, 'moment', affected_moment_uid, op, payload);
  END LOOP;

  RETURN NULL;
END;
$$;

-- Create enqueue_person_sync trigger function
-- Writes people changes to sync_outbox for all active connections belonging to this user
CREATE OR REPLACE FUNCTION public.enqueue_person_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conn RECORD;
  op   TEXT;
  payload JSONB;
  affected_user_id   UUID;
  affected_person_uid UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    affected_user_id    := OLD.user_id;
    affected_person_uid := OLD.person_uid;
    op      := 'delete';
    payload := jsonb_build_object(
      'person_uid', OLD.person_uid,
      'updated_at', now()
    );
  ELSE
    affected_user_id    := NEW.user_id;
    affected_person_uid := NEW.person_uid;
    op      := 'upsert';
    payload := jsonb_build_object(
      'person_uid',         NEW.person_uid,
      'name',               NEW.name,
      'relationship_label', NEW.relationship_label,
      'updated_at',         NEW.updated_at
    );
  END IF;

  FOR conn IN
    SELECT id FROM public.sync_connections
    WHERE user_id = affected_user_id AND status = 'active'
  LOOP
    INSERT INTO public.sync_outbox
      (connection_id, user_id, entity_type, entity_uid, operation, payload)
    VALUES
      (conn.id, affected_user_id, 'person', affected_person_uid, op, payload);
  END LOOP;

  RETURN NULL;
END;
$$;

-- Attach trigger to moments table
DROP TRIGGER IF EXISTS trg_enqueue_moment_sync ON public.moments;
CREATE TRIGGER trg_enqueue_moment_sync
AFTER INSERT OR UPDATE OR DELETE ON public.moments
FOR EACH ROW EXECUTE FUNCTION public.enqueue_moment_sync();

-- Attach trigger to people table
DROP TRIGGER IF EXISTS trg_enqueue_person_sync ON public.people;
CREATE TRIGGER trg_enqueue_person_sync
AFTER INSERT OR UPDATE OR DELETE ON public.people
FOR EACH ROW EXECUTE FUNCTION public.enqueue_person_sync();
