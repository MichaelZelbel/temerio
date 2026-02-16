-- Allow users to delete their own provenance rows (needed for edit flow)
CREATE POLICY "Users delete own provenance"
ON public.event_provenance
FOR DELETE
USING (auth.uid() = user_id);