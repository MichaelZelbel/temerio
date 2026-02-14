
-- =============================================
-- TEMERIO CORE SCHEMA
-- =============================================

-- 1) PEOPLE
CREATE TABLE public.people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  relationship_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own people" ON public.people FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own people" ON public.people FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own people" ON public.people FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own people" ON public.people FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON public.people
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) DOCUMENTS
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  primary_person_id uuid REFERENCES public.people(id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL DEFAULT 'application/pdf',
  status text NOT NULL DEFAULT 'uploaded',
  source_language text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own documents" ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own documents" ON public.documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own documents" ON public.documents FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_documents_user_status ON public.documents(user_id, status);
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) EVENTS
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date_start date NOT NULL,
  date_end date,
  headline_en text NOT NULL,
  description_en text,
  status text NOT NULL DEFAULT 'unknown',
  confidence_date int NOT NULL DEFAULT 5,
  confidence_truth int NOT NULL DEFAULT 5,
  importance int NOT NULL DEFAULT 5,
  is_potential_major boolean NOT NULL DEFAULT false,
  merge_auto boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'manual',
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own events" ON public.events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own events" ON public.events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own events" ON public.events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own events" ON public.events FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_events_user_date ON public.events(user_id, date_start);
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) EVENT_PARTICIPANTS (join table)
CREATE TABLE public.event_participants (
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, person_id)
);
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- RLS via the event's user_id
CREATE POLICY "Users manage own event participants" ON public.event_participants FOR ALL
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_id AND events.user_id = auth.uid()));

-- 5) EVENT_PROVENANCE
CREATE TABLE public.event_provenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  page_number int,
  snippet_original text,
  snippet_en text,
  language text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.event_provenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own provenance" ON public.event_provenance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own provenance" ON public.event_provenance FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6) REVIEW_QUEUE
CREATE TABLE public.review_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own review items" ON public.review_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own review items" ON public.review_queue FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own review items" ON public.review_queue FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_review_queue_updated_at BEFORE UPDATE ON public.review_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7) AI_USAGE_LEDGER
CREATE TABLE public.ai_usage_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  action text NOT NULL,
  credits_used int NOT NULL DEFAULT 0,
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  meta jsonb
);
ALTER TABLE public.ai_usage_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own usage ledger" ON public.ai_usage_ledger FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own usage ledger" ON public.ai_usage_ledger FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_ai_usage_ledger_user_date ON public.ai_usage_ledger(user_id, created_at DESC);

-- 8) DOCUMENTS STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Users upload own documents" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users view own documents" ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own documents" ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
