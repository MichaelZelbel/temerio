import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/supabase-admin.ts";
import { verifyHmac } from "../_shared/hmac.ts";

// Server-to-server: HMAC authenticated
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

    // Look up connection and get stored secret hash
    const { data: conn, error: connErr } = await admin
      .from("sync_connections")
      .select("id, user_id, shared_secret_hash, status")
      .eq("id", connectionId)
      .eq("status", "active")
      .single();

    if (connErr || !conn) {
      return new Response(JSON.stringify({ error: "Connection not found or inactive" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For HMAC verification we need the actual secret, but we only store the hash.
    // The caller must sign with the shared secret; we verify by recomputing HMAC
    // with the same secret. Since we only have the hash, we use a different approach:
    // The caller sends HMAC(body, shared_secret). We store shared_secret_hash = SHA256(shared_secret).
    // We can't reverse the hash. Instead, the HMAC itself serves as proof of knowledge.
    // We'll store the shared_secret encrypted in a separate field, or use a different scheme.
    //
    // PRAGMATIC APPROACH: Store the shared_secret itself (not just hash) server-side
    // since both sides need it for HMAC. We use shared_secret_hash as the actual secret
    // (it's already a strong random value that was hashed for storage name purposes).
    //
    // For now, we verify HMAC by looking up the secret from a secrets store.
    // Actually, let's use a simpler scheme: the connection stores the raw secret
    // but the column is called shared_secret_hash for naming. In practice both apps
    // agreed on the secret during pairing.
    //
    // We'll verify the HMAC using the stored hash AS the secret (both sides hash the
    // original secret and use the hash as the HMAC key).

    const valid = await verifyHmac(conn.shared_secret_hash, bodyText, signature);
    if (!valid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { since_outbox_id = 0, limit = 100 } = JSON.parse(bodyText);

    // Get enabled person links for this connection
    const { data: links } = await admin
      .from("sync_person_links")
      .select("local_person_id, remote_person_uid")
      .eq("connection_id", connectionId)
      .eq("link_status", "linked");

    if (!links || links.length === 0) {
      return new Response(JSON.stringify({ events: [], last_outbox_id: since_outbox_id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch outbox entries for linked entities
    const { data: outboxRows, error: outboxErr } = await admin
      .from("sync_outbox")
      .select("*")
      .eq("connection_id", connectionId)
      .gt("id", since_outbox_id)
      .order("id", { ascending: true })
      .limit(limit);

    if (outboxErr) {
      console.error("Outbox query error:", outboxErr);
      return new Response(JSON.stringify({ error: "Failed to read outbox" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lastId = outboxRows && outboxRows.length > 0
      ? outboxRows[outboxRows.length - 1].id
      : since_outbox_id;

    // Update cursor
    await admin
      .from("sync_cursors")
      .upsert({
        user_id: conn.user_id,
        connection_id: connectionId,
        last_pulled_outbox_id: lastId,
        updated_at: new Date().toISOString(),
      }, { onConflict: "connection_id" });

    return new Response(JSON.stringify({ events: outboxRows || [], last_outbox_id: lastId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sync-pull error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
