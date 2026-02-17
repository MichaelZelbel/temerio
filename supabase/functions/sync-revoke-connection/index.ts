import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";
import { verifyHmac } from "../_shared/hmac.ts";

// Server-to-server: HMAC authenticated. Called by the remote app to revoke a connection.
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

    // Look up connection — accept active OR already revoked for idempotency
    const { data: conn, error: connErr } = await admin
      .from("sync_connections")
      .select("id, user_id, shared_secret_hash, status")
      .eq("id", connectionId)
      .single();

    if (connErr || !conn) {
      return new Response(JSON.stringify({ error: "Connection not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify HMAC
    const valid = await verifyHmac(conn.shared_secret_hash, bodyText, signature);
    if (!valid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Already revoked — idempotent success
    if (conn.status === "revoked") {
      return new Response(JSON.stringify({ ok: true, already_revoked: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Revoke
    const { error: updateErr } = await admin
      .from("sync_connections")
      .update({ status: "revoked" })
      .eq("id", conn.id);

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
