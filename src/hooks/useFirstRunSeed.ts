import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * On first login, ensures the user has at least one Person ("Self")
 * and one Moment ("Temerio account created") so the app never starts blank.
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
    const { data: existing } = await supabase
      .from("people")
      .select("id")
      .eq("user_id", userId)
      .eq("relationship_label", "Self")
      .maybeSingle();

    if (existing) {
      defaultPersonId = existing.id;
    } else {
      const { data } = await supabase
        .from("people")
        .insert({ user_id: userId, name, relationship_label: "Self" })
        .select("id")
        .single();
      if (data) defaultPersonId = data.id;
    }
  }

  // 2) Check if user already has any moments
  const { count: momentCount } = await supabase
    .from("moments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (momentCount === 0) {
    const today = new Date().toISOString().split("T")[0];
    const { data: moment } = await supabase
      .from("moments")
      .insert({
        user_id: userId,
        happened_at: today,
        title: "Temerio account created",
        description: "Created a Temerio account.",
        status: "past_fact",
        confidence_date: 10,
        confidence_truth: 10,
        impact_level: 3,
        source: "manual",
        verified: true,
      })
      .select("id")
      .single();

    // Link moment to the default person if we just created one
    if (moment && defaultPersonId) {
      await supabase.from("moment_participants").insert({
        moment_id: moment.id,
        person_id: defaultPersonId,
      });
    }
  }
}
