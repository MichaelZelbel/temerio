import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createAdminClient, createUserClient } from "../_shared/supabase-admin.ts";
import { computeHmac } from "../_shared/hmac.ts";

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

    const sb = createUserClient(authHeader);
    const { data: { user }, error: authErr } = await sb.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { connection_id } = await req.json();
    if (!connection_id) {
      return new Response(JSON.stringify({ error: "connection_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createAdminClient();

    // Get connection details
    const { data: conn, error: connErr } = await admin
      .from("sync_connections")
      .select("id, remote_base_url, shared_secret_hash, remote_connection_id, status, user_id")
      .eq("id", connection_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (connErr || !conn) {
      return new Response(JSON.stringify({ error: "Connection not found or inactive" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!conn.remote_base_url || !conn.remote_connection_id) {
      return new Response(JSON.stringify({ error: "Connection missing remote URL or remote connection ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call remote endpoint with HMAC auth
    const body = JSON.stringify({ limit: 500 });
    const signature = await computeHmac(conn.shared_secret_hash, body);

    const remoteUrl = `${conn.remote_base_url}/functions/v1/sync-list-people`;
    console.log("Calling remote:", remoteUrl);

    const resp = await fetch(remoteUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sync-signature": signature,
        "x-sync-connection-id": conn.remote_connection_id,
      },
      body,
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Remote sync-list-people failed:", resp.status, errText);
      return new Response(JSON.stringify({ error: "Remote app returned an error", details: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sync-list-remote-people error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
