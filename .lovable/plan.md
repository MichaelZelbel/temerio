

## Add Documents to Events

Allow users to attach existing documents (from their library) to an event when creating or editing it, stored via the `event_provenance` table -- the same mechanism used by the PDF upload flow.

### What changes

**1. AddEventDialog.tsx -- Add a document picker section**

- Add state for selected document IDs: `selectedDocIds: string[]`
- Accept a new prop `documents` (list of user's documents with `id` and `file_name`)
- Render a checkbox list of documents (similar to the people picker) below the people section, labeled "Linked Documents"
- When editing, pre-populate `selectedDocIds` from existing `event_provenance` rows

**2. AddEventDialog.tsx -- Save logic**

- On create: after inserting the event, insert one `event_provenance` row per selected document (`user_id`, `event_id`, `document_id`; `page_number` and `snippet_en` left null for manual links)
- On edit: delete existing `event_provenance` rows for the event, then re-insert for the current selection (same pattern already used for participants)

**3. TimelinePage.tsx -- Pass documents and load provenance for edit**

- Fetch documents alongside events and people in `fetchData`
- Pass the documents list to `AddEventDialog`
- When opening the edit dialog, include the event's linked document IDs (from provenance) in `editEventData`

### Technical details

- New prop on `AddEventDialog`: `documents: { id: string; file_name: string }[]`
- New field on `EditEventData` interface: `documentIds?: string[]`
- New state in dialog: `selectedDocIds`
- Provenance insert uses: `{ user_id, event_id, document_id }` with null snippet/page (distinguishing manual links from PDF-extracted ones)
- On edit save: `await supabase.from("event_provenance").delete().eq("event_id", eventId)` before re-inserting

