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

    const { connection_id, local_person_id } = await req.json();
    if (!connection_id || !local_person_id) {
      return new Response(JSON.stringify({ error: "connection_id and local_person_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createAdminClient();

    // Get connection
    const { data: conn, error: connErr } = await admin
      .from("sync_connections")
      .select("id, remote_base_url, shared_secret_hash, remote_connection_id, user_id")
      .eq("id", connection_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (connErr || !conn || !conn.remote_base_url || !conn.remote_connection_id) {
      return new Response(JSON.stringify({ error: "Connection not found or misconfigured" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get local person
    const { data: person, error: personErr } = await admin
      .from("people")
      .select("id, person_uid, name, relationship_label")
      .eq("id", local_person_id)
      .eq("user_id", user.id)
      .single();

    if (personErr || !person) {
      return new Response(JSON.stringify({ error: "Person not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Push person to remote
    const body = JSON.stringify({
      person_uid: person.person_uid,
      name: person.name,
      relationship_label: person.relationship_label,
    });
    const signature = await computeHmac(conn.shared_secret_hash, body);

    const resp = await fetch(`${conn.remote_base_url}/functions/v1/sync-create-person`, {
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
      console.error("Remote sync-create-person failed:", resp.status, errText);
      return new Response(JSON.stringify({ error: "Remote app rejected the person creation" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const remoteData = await resp.json();

    // Create the link locally
    await admin
      .from("sync_person_links")
      .upsert({
        user_id: user.id,
        connection_id,
        local_person_id: person.id,
        remote_person_uid: person.person_uid,
        link_status: "linked",
        link_source: "manual",
        is_enabled: true,
      }, { onConflict: "user_id,connection_id,local_person_id" });

    return new Response(JSON.stringify({ success: true, remote: remoteData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sync-create-remote-person error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
