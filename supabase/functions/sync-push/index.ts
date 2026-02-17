import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";
import { verifyHmac } from "../_shared/hmac.ts";

// Server-to-server: HMAC authenticated push of remote events
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("x-sync-signature");
    const connectionId = req.headers.get("x-sync-connection-id");

    if (!signature || !connectionId) {
      return new Response(JSON.stringify({ error: "Missing x-sync-signature or x-sync-connection-id" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bodyText = await req.text();
    const admin = createAdminClient();

    // Iterate all active connections and verify HMAC to find the local one
    // (x-sync-connection-id contains the remote app's ID, not ours)
    const { data: activeConnections, error: connErr } = await admin
      .from("sync_connections")
      .select("id, user_id, shared_secret_hash, status")
      .eq("status", "active");

    if (connErr || !activeConnections || activeConnections.length === 0) {
      return new Response(JSON.stringify({ error: "No active connections" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let conn: typeof activeConnections[number] | null = null;
    for (const c of activeConnections) {
      if (!c.shared_secret_hash) continue;
      if (await verifyHmac(c.shared_secret_hash, bodyText, signature)) {
        conn = c;
        break;
      }
    }

    if (!conn) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { events } = JSON.parse(bodyText);
    if (!Array.isArray(events) || events.length === 0) {
      return new Response(JSON.stringify({ applied: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get person links for resolving remote_person_uid -> local_person_id
    const { data: links } = await admin
      .from("sync_person_links")
      .select("local_person_id, remote_person_uid")
      .eq("connection_id", connectionId)
      .eq("link_status", "linked");

    const personMap = new Map<string, string>();
    for (const l of links || []) {
      personMap.set(l.remote_person_uid, l.local_person_id);
    }

    let applied = 0;
    const conflicts: Array<{ entity_uid: string; entity_type: string; reason: string }> = [];

    for (const evt of events) {
      const { entity_type, entity_uid, operation, payload } = evt;

      try {
        if (entity_type === "person") {
          await applyPerson(admin, conn.user_id, entity_uid, operation, payload, connectionId);
          applied++;
        } else if (entity_type === "moment") {
          const result = await applyMoment(admin, conn.user_id, entity_uid, operation, payload, personMap, connectionId);
          if (result === "conflict") {
            conflicts.push({ entity_uid, entity_type, reason: "Both sides modified since last sync" });
          } else {
            applied++;
          }
        }
      } catch (err) {
        console.error(`Failed to apply ${entity_type}/${entity_uid}:`, err);
        conflicts.push({ entity_uid, entity_type, reason: err instanceof Error ? err.message : "Unknown" });
      }
    }

    return new Response(JSON.stringify({ applied, conflicts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sync-push error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function applyPerson(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  personUid: string,
  operation: string,
  payload: Record<string, unknown>,
  _connectionId: string,
) {
  if (operation === "delete") {
    // Soft-delete not supported for people; skip
    return;
  }

  // Check if person already exists locally
  const { data: existing } = await admin
    .from("people")
    .select("id, updated_at")
    .eq("user_id", userId)
    .eq("person_uid", personUid)
    .single();

  if (existing) {
    // Update if remote is newer
    const remoteUpdated = new Date(payload.updated_at as string);
    const localUpdated = new Date(existing.updated_at);
    if (remoteUpdated > localUpdated) {
      await admin
        .from("people")
        .update({
          name: payload.name as string,
          relationship_label: (payload.relationship_label as string) || null,
          updated_at: payload.updated_at as string,
        })
        .eq("id", existing.id);
    }
  } else {
    // Create new person
    await admin.from("people").insert({
      user_id: userId,
      person_uid: personUid,
      name: (payload.name as string) || "Unknown",
      relationship_label: (payload.relationship_label as string) || null,
    });
  }
}

async function applyMoment(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  momentUid: string,
  operation: string,
  payload: Record<string, unknown>,
  personMap: Map<string, string>,
  connectionId: string,
): Promise<"applied" | "conflict"> {
  // Check if moment exists locally
  const { data: existing } = await admin
    .from("moments")
    .select("id, updated_at")
    .eq("user_id", userId)
    .eq("moment_uid", momentUid)
    .single();

  if (operation === "delete") {
    if (existing) {
      await admin
        .from("moments")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", existing.id);
    }
    return "applied";
  }

  // Resolve person
  let personId: string | null = null;
  if (payload.person_uid) {
    personId = personMap.get(payload.person_uid as string) || null;
  }

  const momentData = {
    title: payload.title as string,
    description: (payload.description as string) || null,
    happened_at: payload.happened_at as string,
    happened_end: (payload.happened_end as string) || null,
    impact_level: (payload.impact_level as number) || 2,
    category: (payload.category as string) || null,
    status: (payload.status as string) || "unknown",
    attachments: payload.attachments || null,
    updated_at: payload.updated_at as string,
    person_id: personId,
    source: "sync",
  };

  if (existing) {
    const remoteUpdated = new Date(payload.updated_at as string);
    const localUpdated = new Date(existing.updated_at);

    // If both modified, create conflict
    if (localUpdated > remoteUpdated) {
      // Local is newer, store conflict for user review
      await admin.from("sync_conflicts").insert({
        user_id: userId,
        connection_id: connectionId,
        entity_type: "moment",
        entity_uid: momentUid,
        local_payload: existing as unknown as Record<string, unknown>,
        remote_payload: payload as unknown as Record<string, unknown>,
      });
      return "conflict";
    }

    // Remote is newer: apply
    await admin
      .from("moments")
      .update(momentData)
      .eq("id", existing.id);
  } else {
    // Create new moment
    await admin.from("moments").insert({
      ...momentData,
      user_id: userId,
      moment_uid: momentUid,
    });
  }

  return "applied";
}
