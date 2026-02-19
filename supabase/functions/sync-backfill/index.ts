import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";

/**
 * sync-backfill: Queues all historical people + moments into sync_outbox
 * for each active connection, respecting linked people and deduping entries
 * already in the outbox.
 *
 * Returns { queued_people, queued_moments }
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createAdminClient();
    const { data: userData, error: userErr } = await admin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const { connection_id } = body as { connection_id?: string };

    // Load active connections for this user
    let connQuery = admin
      .from("sync_connections")
      .select("id, status")
      .eq("user_id", userId)
      .eq("status", "active");

    if (connection_id) {
      connQuery = connQuery.eq("id", connection_id);
    }

    const { data: connections, error: connErr } = await connQuery;
    if (connErr || !connections || connections.length === 0) {
      return new Response(JSON.stringify({ error: "No active connections found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalQueuedPeople = 0;
    let totalQueuedMoments = 0;

    for (const conn of connections) {
      const { queued_people, queued_moments } = await backfillConnection(
        admin,
        userId,
        conn.id,
      );
      totalQueuedPeople += queued_people;
      totalQueuedMoments += queued_moments;
    }

    return new Response(
      JSON.stringify({ queued_people: totalQueuedPeople, queued_moments: totalQueuedMoments }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("sync-backfill error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

async function backfillConnection(
  admin: ReturnType<typeof import("../_shared/supabase-admin.ts").createAdminClient>,
  userId: string,
  connectionId: string,
): Promise<{ queued_people: number; queued_moments: number }> {
  // Load enabled person links for this connection
  const { data: links } = await admin
    .from("sync_person_links")
    .select("local_person_id, remote_person_uid")
    .eq("connection_id", connectionId)
    .eq("user_id", userId)
    .eq("is_enabled", true)
    .eq("link_status", "linked");

  if (!links || links.length === 0) {
    return { queued_people: 0, queued_moments: 0 };
  }

  const linkedPersonIds = links.map((l) => l.local_person_id);

  // Load all people that are linked
  const { data: people } = await admin
    .from("people")
    .select("id, person_uid, name, relationship_label, updated_at")
    .eq("user_id", userId)
    .in("id", linkedPersonIds)
    .is("deleted_at", null);

  // Load all moments for linked people
  const { data: moments } = await admin
    .from("moments")
    .select(
      "id, moment_uid, title, description, happened_at, happened_end, impact_level, category, status, attachments, person_id, updated_at",
    )
    .eq("user_id", userId)
    .in("person_id", linkedPersonIds)
    .is("deleted_at", null);

  // Load existing outbox entries for this connection to dedup
  const { data: existingOutbox } = await admin
    .from("sync_outbox")
    .select("entity_uid, entity_type")
    .eq("connection_id", connectionId)
    .eq("user_id", userId);

  // Build dedup sets: "entity_type:entity_uid"
  const existing = new Set<string>();
  for (const row of existingOutbox || []) {
    existing.add(`${row.entity_type}:${row.entity_uid}`);
  }

  // Build a map: person uuid id -> person_uid for moment payloads
  const personUidMap = new Map<string, string>();
  for (const p of people || []) {
    personUidMap.set(p.id, p.person_uid);
  }

  const peopleToInsert: Array<Record<string, unknown>> = [];
  const momentsToInsert: Array<Record<string, unknown>> = [];

  // Build person outbox rows
  for (const p of people || []) {
    const key = `person:${p.person_uid}`;
    if (existing.has(key)) continue;

    peopleToInsert.push({
      connection_id: connectionId,
      user_id: userId,
      entity_type: "person",
      entity_uid: p.person_uid,
      operation: "upsert",
      payload: {
        person_uid: p.person_uid,
        name: p.name,
        relationship_label: p.relationship_label,
        updated_at: p.updated_at,
      },
    });
  }

  // Build moment outbox rows
  for (const m of moments || []) {
    const key = `moment:${m.moment_uid}`;
    if (existing.has(key)) continue;

    const personUid = m.person_id ? personUidMap.get(m.person_id) : null;

    momentsToInsert.push({
      connection_id: connectionId,
      user_id: userId,
      entity_type: "moment",
      entity_uid: m.moment_uid,
      operation: "upsert",
      payload: {
        moment_uid: m.moment_uid,
        title: m.title,
        description: m.description,
        happened_at: m.happened_at,
        happened_end: m.happened_end,
        impact_level: m.impact_level,
        category: m.category,
        status: m.status,
        attachments: m.attachments,
        person_uid: personUid ?? null,
        updated_at: m.updated_at,
      },
    });
  }

  // Insert in batches
  if (peopleToInsert.length > 0) {
    const { error } = await admin.from("sync_outbox").insert(peopleToInsert);
    if (error) {
      console.error("Failed to insert people into outbox:", error);
    }
  }

  if (momentsToInsert.length > 0) {
    const { error } = await admin.from("sync_outbox").insert(momentsToInsert);
    if (error) {
      console.error("Failed to insert moments into outbox:", error);
    }
  }

  return {
    queued_people: peopleToInsert.length,
    queued_moments: momentsToInsert.length,
  };
}
