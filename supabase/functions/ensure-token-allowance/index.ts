import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[ENSURE-TOKEN-ALLOWANCE] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    log("Function started");

    // Parse body
    let targetUserId: string | null = null;
    let batchInit = false;
    try {
      const body = await req.json();
      targetUserId = body.user_id || null;
      batchInit = body.batch_init === true;
    } catch {
      // empty body is fine
    }

    // Authenticate caller
    let callerId: string | null = null;
    let callerIsAdmin = false;
    const authHeader = req.headers.get("Authorization");

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data.user) {
        callerId = data.user.id;
        const { data: roleData } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", callerId)
          .single();
        callerIsAdmin = roleData?.role === "admin";
        log("Caller authenticated", { callerId, isAdmin: callerIsAdmin });
      }
    }

    // Authorization checks
    if (batchInit && !callerIsAdmin) {
      // Allow service-role calls (no auth header) or admin
      if (authHeader) {
        return new Response(JSON.stringify({ error: "Admin required for batch_init" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (targetUserId && targetUserId !== callerId && !callerIsAdmin && authHeader) {
      return new Response(JSON.stringify({ error: "Admin required to manage other users" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve the user to process
    const userId = targetUserId || callerId;

    if (batchInit) {
      log("Batch init mode");
      const result = await handleBatchInit(supabaseAdmin);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "No user identified" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log("Ensuring allowance for user", { userId });
    const allowance = await ensureAllowance(supabaseAdmin, userId);

    return new Response(JSON.stringify(allowance), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── Core logic ───

async function ensureAllowance(admin: ReturnType<typeof createClient>, userId: string) {
  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  // Check existing period
  const { data: existing } = await admin
    .from("ai_allowance_periods")
    .select("*")
    .eq("user_id", userId)
    .gte("period_end", now.toISOString())
    .lte("period_start", now.toISOString())
    .limit(1)
    .maybeSingle();

  if (existing) {
    log("Existing period found", { id: existing.id });
    return existing;
  }

  // Get user role
  const { data: roleData } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();

  const role = roleData?.role || "free";
  const isPremium = ["premium", "premium_gift", "admin"].includes(role);
  log("User role", { role, isPremium });

  // Get settings
  const { data: settings } = await admin
    .from("ai_credit_settings")
    .select("key, value_int")
    .in("key", ["tokens_per_credit", "credits_free_per_month", "credits_premium_per_month"]);

  const settingsMap: Record<string, number> = {};
  for (const s of settings || []) {
    settingsMap[s.key] = s.value_int;
  }

  const tokensPerCredit = settingsMap["tokens_per_credit"] || 200;
  const creditsPerMonth = isPremium
    ? (settingsMap["credits_premium_per_month"] || 1500)
    : (settingsMap["credits_free_per_month"] || 0);
  const baseTokens = creditsPerMonth * tokensPerCredit;
  log("Token calculation", { tokensPerCredit, creditsPerMonth, baseTokens });

  // Calculate rollover from previous period
  let rolloverTokens = 0;
  const prevPeriodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const { data: prevPeriod } = await admin
    .from("ai_allowance_periods")
    .select("tokens_granted, tokens_used")
    .eq("user_id", userId)
    .gte("period_end", prevPeriodStart.toISOString())
    .lt("period_end", periodStart.toISOString())
    .limit(1)
    .maybeSingle();

  if (prevPeriod) {
    const remaining = Math.max(0, (prevPeriod.tokens_granted || 0) - (prevPeriod.tokens_used || 0));
    rolloverTokens = Math.min(remaining, baseTokens); // cap at base
    log("Rollover from previous period", { remaining, capped: rolloverTokens });
  }

  const totalGranted = baseTokens + rolloverTokens;
  const source = isPremium ? "subscription" : "free_tier";

  const { data: newPeriod, error: insertError } = await admin
    .from("ai_allowance_periods")
    .insert({
      user_id: userId,
      tokens_granted: totalGranted,
      tokens_used: 0,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      source,
      metadata: {
        base_tokens: baseTokens,
        rollover_tokens: rolloverTokens,
        credits_per_month: creditsPerMonth,
        tokens_per_credit: tokensPerCredit,
        role,
      },
    })
    .select()
    .single();

  if (insertError) throw new Error(`Insert failed: ${insertError.message}`);
  log("New period created", { id: newPeriod.id, totalGranted });
  return newPeriod;
}

async function handleBatchInit(admin: ReturnType<typeof createClient>) {
  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  // Get all user IDs
  const { data: profiles, error: profilesErr } = await admin
    .from("profiles")
    .select("id");

  if (profilesErr) throw new Error(`Failed to fetch profiles: ${profilesErr.message}`);

  // Get users who already have a current period
  const { data: existingPeriods } = await admin
    .from("ai_allowance_periods")
    .select("user_id")
    .gte("period_end", now.toISOString())
    .lte("period_start", now.toISOString());

  const existingSet = new Set((existingPeriods || []).map((p) => p.user_id));
  const needsInit = (profiles || []).filter((p) => !existingSet.has(p.id));

  log("Batch init", { total: profiles?.length, alreadyHave: existingSet.size, needsInit: needsInit.length });

  let initialized = 0;
  for (const profile of needsInit) {
    try {
      await ensureAllowance(admin, profile.id);
      initialized++;
    } catch (err) {
      log("Batch init error for user", { userId: profile.id, error: String(err) });
    }
  }

  return { initialized, total: profiles?.length, skipped: existingSet.size };
}
