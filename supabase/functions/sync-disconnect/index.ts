import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createUserClient, createAdminClient } from "../_shared/supabase-admin.ts";
import { computeHmac } from "../_shared/hmac.ts";

// User-authenticated: disconnect from remote app, notify remote side best-effort.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createUserClient(authHeader);
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const { connection_id } = await req.json();
    if (!connection_id) {
      return new Response(JSON.stringify({ error: "connection_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createAdminClient();

    // Fetch connection owned by this user
    const { data: conn, error: connErr } = await admin
      .from("sync_connections")
      .select("id, shared_secret_hash, remote_base_url, remote_connection_id, status")
      .eq("id", connection_id)
      .eq("user_id", userId)
      .single();

    if (connErr || !conn) {
      return new Response(JSON.stringify({ error: "Connection not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Revoke locally
    if (conn.status !== "revoked") {
      await admin
        .from("sync_connections")
        .update({ status: "revoked" })
        .eq("id", conn.id);
    }

    // Notify remote side best-effort
    let remoteNotified = false;
    if (conn.remote_base_url) {
      try {
        // Use remote_connection_id if available; otherwise send our own ID
        // so the remote can look it up via its remote_connection_id field
        const remoteId = conn.remote_connection_id || conn.id;
        const body = JSON.stringify({ reason: "user_disconnect" });
        const signature = await computeHmac(conn.shared_secret_hash, body);

        const revokeUrl = `${conn.remote_base_url}/functions/v1/sync-revoke-connection`;
        const resp = await fetch(revokeUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-sync-signature": signature,
            "x-sync-connection-id": remoteId,
          },
          body,
        });

        remoteNotified = resp.ok;
        if (!resp.ok) {
          console.warn("Remote revoke returned", resp.status, await resp.text());
        }
      } catch (err) {
        console.warn("Failed to notify remote (best-effort):", err);
      }
    }

    return new Response(JSON.stringify({ ok: true, remote_notified: remoteNotified }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sync-disconnect error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
