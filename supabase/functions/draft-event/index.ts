import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an assistant that helps structure life moments for a personal timeline app called Temerio.

The user will describe something that happened (or will happen). Your job is to extract a structured moment from their description.

IMPACT LEVEL (1-4) — measures structural life impact, NOT emotion:
1 = Minor (routine activities, small errands, casual meetups)
2 = Noticeable (starting a hobby, moderate financial decision, moving apartments)
3 = Strong Impact (changing jobs, moving cities, marriage, founding a company)
4 = Life-Shaping (immigration, becoming a parent, life-defining decisions)

Default typical personal events to 1-2 unless clearly chapter-changing.

CONFIDENCE scales (0-10):
- confidence_date: How certain is the date? 10 = exact date given, 5 = approximate, 0 = pure guess
- confidence_truth: How certain is the event true/accurate? 10 = firsthand confirmed, 5 = plausible, 0 = rumor

Use conservative confidence values unless the user indicates strong certainty.

STATUS values:
- past_fact: Already happened
- future_plan: Planned for the future
- ongoing: Currently happening
- unknown: Unclear

Rules:
- Title must be explicit and descriptive (not vague like "Something happened")
- Description should be short and factual
- If no date is mentioned, use today's date provided in the context
- participants should list person names mentioned, can be empty array`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, today, people } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const peopleContext = people && people.length > 0
      ? `\n\nKnown people in the user's timeline: ${people.map((p: { name: string }) => p.name).join(", ")}`
      : "";

    const systemMessage = {
      role: "system",
      content: `${SYSTEM_PROMPT}\n\nToday's date: ${today || new Date().toISOString().split("T")[0]}${peopleContext}`,
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [systemMessage, ...messages],
        tools: [
          {
            type: "function",
            function: {
              name: "draft_moment",
              description: "Return a structured timeline moment draft based on the user's description.",
              parameters: {
                type: "object",
                properties: {
                  happened_at: { type: "string", description: "YYYY-MM-DD format" },
                  happened_end: { type: "string", description: "YYYY-MM-DD format or null" },
                  title: { type: "string", description: "Clear, descriptive headline" },
                  description: { type: "string", description: "Short factual description" },
                  status: { type: "string", enum: ["past_fact", "future_plan", "ongoing", "unknown"] },
                  impact_level: { type: "integer", minimum: 1, maximum: 4 },
                  confidence_date: { type: "integer", minimum: 0, maximum: 10 },
                  confidence_truth: { type: "integer", minimum: 0, maximum: 10 },
                  participants: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of person names mentioned",
                  },
                },
                required: ["happened_at", "title", "status", "impact_level", "confidence_date", "confidence_truth"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "draft_moment" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "draft_moment") {
      console.error("Unexpected AI response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "AI did not return a valid moment draft" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const draft = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ draft }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("draft-event error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
