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

    const { primary_person_id, merged_person_id } = await req.json();
    if (!primary_person_id || !merged_person_id) {
      return new Response(JSON.stringify({ error: "primary_person_id and merged_person_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (primary_person_id === merged_person_id) {
      return new Response(JSON.stringify({ error: "Cannot merge a person with themselves" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createAdminClient();

    // Verify both people belong to user
    const { data: people, error: pErr } = await admin
      .from("people")
      .select("id, name, person_uid")
      .eq("user_id", user.id)
      .in("id", [primary_person_id, merged_person_id]);

    if (pErr || !people || people.length !== 2) {
      return new Response(JSON.stringify({ error: "One or both people not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const primary = people.find((p: any) => p.id === primary_person_id);
    const merged = people.find((p: any) => p.id === merged_person_id);

    // 1. Repoint moments from merged to primary
    const { data: movedMoments } = await admin
      .from("moments")
      .update({ person_id: primary_person_id, updated_at: new Date().toISOString() })
      .eq("person_id", merged_person_id)
      .eq("user_id", user.id)
      .select("id");

    // 2. Repoint moment_participants
    // First get existing participant rows for primary to avoid duplicates
    const { data: existingParticipants } = await admin
      .from("moment_participants")
      .select("moment_id")
      .eq("person_id", primary_person_id);

    const existingMomentIds = new Set((existingParticipants || []).map((p: any) => p.moment_id));

    const { data: mergedParticipants } = await admin
      .from("moment_participants")
      .select("moment_id")
      .eq("person_id", merged_person_id);

    // Update non-conflicting participants
    for (const mp of mergedParticipants || []) {
      if (!existingMomentIds.has(mp.moment_id)) {
        await admin
          .from("moment_participants")
          .update({ person_id: primary_person_id })
          .eq("person_id", merged_person_id)
          .eq("moment_id", mp.moment_id);
      } else {
        // Delete duplicate
        await admin
          .from("moment_participants")
          .delete()
          .eq("person_id", merged_person_id)
          .eq("moment_id", mp.moment_id);
      }
    }

    // 3. Repoint sync_person_links from merged to primary
    await admin
      .from("sync_person_links")
      .update({ local_person_id: primary_person_id, updated_at: new Date().toISOString() })
      .eq("local_person_id", merged_person_id)
      .eq("user_id", user.id);

    // 4. Mark merged person
    await admin
      .from("people")
      .update({
        merged_into_person_id: primary_person_id,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", merged_person_id);

    // 5. Create merge log
    const { data: mergeLog } = await admin
      .from("sync_merge_log")
      .insert({
        user_id: user.id,
        entity_type: "person",
        primary_id: primary_person_id,
        merged_id: merged_person_id,
        merge_payload: {
          merged_name: merged!.name,
          merged_person_uid: merged!.person_uid,
          primary_name: primary!.name,
          moments_moved: (movedMoments || []).length,
          participants_moved: (mergedParticipants || []).length,
        },
      })
      .select("id")
      .single();

    return new Response(JSON.stringify({
      success: true,
      merge_log_id: mergeLog?.id,
      moments_moved: (movedMoments || []).length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sync-merge-local-people error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
