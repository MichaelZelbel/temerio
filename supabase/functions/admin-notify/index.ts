import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APP_NAME = "Temerio";

interface NotifyPayload {
  event: "user_registered" | "user_subscribed" | "user_unsubscribed" | "user_deleted";
  userId: string;
  userEmail: string;
  plan?: string;
}

const SUBJECTS: Record<NotifyPayload["event"], string> = {
  user_registered: `New User Registered at ${APP_NAME}`,
  user_subscribed: `User Subscribed to Plan at ${APP_NAME}`,
  user_unsubscribed: `User Unsubscribed at ${APP_NAME}`,
  user_deleted: `User Account Deleted at ${APP_NAME}`,
};

const EVENT_LABELS: Record<NotifyPayload["event"], string> = {
  user_registered: "New User Registration",
  user_subscribed: "User Subscribed",
  user_unsubscribed: "User Unsubscribed",
  user_deleted: "Account Deleted",
};

function buildHtml(payload: NotifyPayload, timestamp: string): string {
  const planRow = payload.plan
    ? `<tr><td style="padding:8px 0;color:#6b7280;width:140px;">Plan</td><td style="padding:8px 0;font-weight:600;">${payload.plan}</td></tr>`
    : "";
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="background:#1a1a2e;padding:24px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">${APP_NAME} Admin</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 20px;font-size:20px;color:#111827;">${EVENT_LABELS[payload.event]}</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#111827;">
        <tr><td style="padding:8px 0;color:#6b7280;width:140px;">Event</td><td style="padding:8px 0;font-weight:600;">${EVENT_LABELS[payload.event]}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">User ID</td><td style="padding:8px 0;font-family:monospace;font-size:12px;">${payload.userId}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">Email</td><td style="padding:8px 0;">${payload.userEmail}</td></tr>
        ${planRow}
        <tr><td style="padding:8px 0;color:#6b7280;">Timestamp (UTC)</td><td style="padding:8px 0;">${timestamp}</td></tr>
      </table>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">Automated notification from ${APP_NAME}</p>
    </div>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY is not configured");

    const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL");
    if (!adminEmail) throw new Error("ADMIN_NOTIFICATION_EMAIL is not configured");

    const payload: NotifyPayload = await req.json();
    const timestamp = new Date().toISOString();

    console.log(`[ADMIN-NOTIFY] Sending ${payload.event} notification for ${payload.userEmail}`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${APP_NAME} <onboarding@resend.dev>`,
        to: [adminEmail],
        subject: SUBJECTS[payload.event],
        html: buildHtml(payload, timestamp),
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[ADMIN-NOTIFY] Resend API error: ${res.status} ${errBody}`);
      return new Response(JSON.stringify({ error: `Resend error: ${res.status}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 502,
      });
    }

    const data = await res.json();
    console.log(`[ADMIN-NOTIFY] Email sent successfully`, data);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[ADMIN-NOTIFY] ERROR: ${msg}`);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
