import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";
import { verifyHmac } from "../_shared/hmac.ts";

// Server-to-server: HMAC authenticated. Called by the remote app to revoke a connection.
// The x-sync-connection-id contains the REMOTE app's connection ID, not ours.
// We identify the correct local connection by verifying the HMAC signature
// against each active connection's shared_secret_hash.
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

    // Fetch all active connections
    const { data: activeConnections, error: fetchErr } = await admin
      .from("sync_connections")
      .select("id, user_id, shared_secret_hash, status")
      .eq("status", "active");

    if (fetchErr) {
      console.error("Failed to fetch active connections:", fetchErr);
      return new Response(JSON.stringify({ error: "Internal error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No active connections — idempotent success
    if (!activeConnections || activeConnections.length === 0) {
      return new Response(JSON.stringify({ ok: true, already_revoked: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the connection whose shared_secret_hash matches the HMAC signature
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

    // Revoke the matched connection
    const { error: updateErr } = await admin
      .from("sync_connections")
      .update({ status: "revoked" })
      .eq("id", matchedConn.id);

    if (updateErr) {
      console.error("Failed to revoke connection:", updateErr);
      return new Response(JSON.stringify({ error: "Failed to revoke" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sync-revoke-connection error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
