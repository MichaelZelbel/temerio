import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * On first login, ensures the user has at least one Person ("Self")
 * and one Event ("Account created") so the app never starts blank.
 * Runs once per session; guards against duplicate inserts.
 */
export function useFirstRunSeed() {
  const { user, profile } = useAuth();
  const didRun = useRef(false);

  useEffect(() => {
    if (!user || didRun.current) return;
    didRun.current = true;
    seed(user.id, user.email, profile?.display_name);
  }, [user, profile]);
}

async function seed(userId: string, email: string | undefined, displayName: string | null | undefined) {
  // 1) Check if user already has any people
  const { count: peopleCount } = await supabase
    .from("people")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  let defaultPersonId: string | null = null;

  if (peopleCount === 0) {
    const name = displayName || (email ? email.split("@")[0] : "Me");
    const { data } = await supabase
      .from("people")
      .insert({ user_id: userId, name, relationship_label: "Self" })
      .select("id")
      .single();
    if (data) defaultPersonId = data.id;
  }

  // 2) Check if user already has any events
  const { count: eventCount } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (eventCount === 0) {
    const today = new Date().toISOString().split("T")[0];
    const { data: event } = await supabase
      .from("events")
      .insert({
        user_id: userId,
        date_start: today,
        headline_en: "Temerio account created",
        description_en: "Created a Temerio account.",
        status: "past_fact",
        confidence_date: 10,
        confidence_truth: 10,
        importance: 8,
        source: "manual",
        verified: true,
      })
      .select("id")
      .single();

    // Link event to the default person if we just created one
    if (event && defaultPersonId) {
      await supabase.from("event_participants").insert({
        event_id: event.id,
        person_id: defaultPersonId,
      });
    }
  }
}
