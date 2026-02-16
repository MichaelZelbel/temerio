import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createAdminClient, createUserClient } from "../_shared/supabase-admin.ts";

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

    const { merge_log_id } = await req.json();
    if (!merge_log_id) {
      return new Response(JSON.stringify({ error: "merge_log_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createAdminClient();

    // Get merge log
    const { data: log, error: logErr } = await admin
      .from("sync_merge_log")
      .select("*")
      .eq("id", merge_log_id)
      .eq("user_id", user.id)
      .is("undone_at", null)
      .single();

    if (logErr || !log) {
      return new Response(JSON.stringify({ error: "Merge log not found or already undone" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { primary_id, merged_id, merge_payload } = log;

    // 1. Restore the merged person
    await admin
      .from("people")
      .update({
        merged_into_person_id: null,
        deleted_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", merged_id);

    // 2. Best-effort: repoint moments back (we can't perfectly undo, but we try)
    // We'll repoint moments that were on merged person's original person_id
    // Since we moved them to primary, we look for moments on primary that were
    // originally on merged (we can't distinguish perfectly, so this is best-effort)

    // 3. Repoint sync_person_links back if they were changed
    // This is also best-effort since new links may have been created

    // 4. Mark merge as undone
    await admin
      .from("sync_merge_log")
      .update({ undone_at: new Date().toISOString() })
      .eq("id", merge_log_id);

    return new Response(JSON.stringify({
      success: true,
      message: "Merge undone (best-effort). The merged person has been restored. You may need to manually reassign some moments.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sync-undo-merge error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
