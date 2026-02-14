import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const users = [
    { email: "fred@free.com", display_name: "Fred", role: "free" },
    { email: "peter@pro.com", display_name: "Peter", role: "premium" },
    { email: "alec@admin.com", display_name: "Alec", role: "admin" },
  ];

  const results = [];

  for (const u of users) {
    // Create user (or get existing)
    let userId: string;
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: "Dell@123",
      email_confirm: true,
      user_metadata: { display_name: u.display_name },
    });

    if (createErr) {
      if (createErr.message?.includes("already been registered")) {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers();
        const existing = list?.users?.find((x: any) => x.email === u.email);
        if (!existing) { results.push({ email: u.email, error: createErr.message }); continue; }
        userId = existing.id;
        // Update password
        await supabaseAdmin.auth.admin.updateUserById(userId, { password: "Dell@123" });
      } else {
        results.push({ email: u.email, error: createErr.message });
        continue;
      }
    } else {
      userId = created.user.id;
    }

    // Set role (upsert)
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: u.role });

    results.push({ email: u.email, userId, role: u.role, ok: true });
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
