import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createAdminClient, createUserClient } from "../_shared/supabase-admin.ts";

/**
 * Creates a local person from a remote person's data and links them.
 * Called by the frontend when user accepts "Create in Temerio" suggestion.
 */
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

    const { connection_id, remote_person_uid, name, relationship_label } = await req.json();
    if (!connection_id || !remote_person_uid || !name) {
      return new Response(JSON.stringify({ error: "connection_id, remote_person_uid, and name are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createAdminClient();

    // Verify connection belongs to user and is active
    const { data: conn, error: connErr } = await admin
      .from("sync_connections")
      .select("id")
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

    // Create local person with the SAME person_uid as the remote person
    const { data: newPerson, error: personErr } = await admin
      .from("people")
      .insert({
        user_id: user.id,
        person_uid: remote_person_uid,
        name,
        relationship_label: relationship_label || null,
      })
      .select("id, person_uid")
      .single();

    if (personErr) {
      console.error("Failed to create local person:", personErr);
      return new Response(JSON.stringify({ error: "Failed to create person: " + personErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the link
    const { error: linkErr } = await admin
      .from("sync_person_links")
      .upsert({
        user_id: user.id,
        connection_id,
        local_person_id: newPerson.id,
        remote_person_uid,
        link_status: "linked",
        link_source: "import",
        is_enabled: true,
      }, { onConflict: "user_id,connection_id,local_person_id" });

    if (linkErr) {
      console.error("Failed to create link:", linkErr);
    }

    return new Response(JSON.stringify({ success: true, person: newPerson }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sync-create-local-person error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
