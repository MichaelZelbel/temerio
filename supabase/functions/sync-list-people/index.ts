import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";
import { verifyHmac } from "../_shared/hmac.ts";

// Server-to-server: HMAC authenticated. Called by a remote app to list
// the local user's people. Identifies the correct connection by iterating
// all active connections and verifying the HMAC signature.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("x-sync-signature");
    const connectionId = req.headers.get("x-sync-connection-id");

    if (!signature || !connectionId) {
      return new Response(JSON.stringify({ error: "Missing headers" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bodyText = await req.text();
    const admin = createAdminClient();

    // Find matching connection via HMAC
    const { data: activeConnections, error: fetchErr } = await admin
      .from("sync_connections")
      .select("id, user_id, shared_secret_hash")
      .eq("status", "active");

    if (fetchErr || !activeConnections || activeConnections.length === 0) {
      return new Response(JSON.stringify({ people: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let matchedConn: typeof activeConnections[number] | null = null;
    for (const conn of activeConnections) {
      if (!conn.shared_secret_hash) continue;
      const valid = await verifyHmac(conn.shared_secret_hash, bodyText, signature);
      if (valid) {
        matchedConn = conn;
        break;
      }
    }

    if (!matchedConn) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return all non-deleted people for this user
    const { data: people, error: peopleErr } = await admin
      .from("people")
      .select("person_uid, name, relationship_label")
      .eq("user_id", matchedConn.user_id)
      .is("deleted_at", null)
      .order("name");

    if (peopleErr) {
      console.error("Failed to fetch people:", peopleErr);
      return new Response(JSON.stringify({ error: "Failed to fetch people" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ people: people || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sync-list-people error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
