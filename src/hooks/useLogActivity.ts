import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface QueuedEvent {
  actor_id: string;
  action: string;
  item_type: string;
  item_id?: string | null;
  metadata?: Record<string, unknown>;
}

const BATCH_DELAY = 1000; // flush after 1s of inactivity

export function useLogActivity() {
  const { user } = useAuth();
  const queue = useRef<QueuedEvent[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (queue.current.length === 0) return;
    const batch = [...queue.current];
    queue.current = [];

    const { error } = await supabase.from("activity_events").insert(batch as any);
    if (error) {
      console.error("Failed to log activity:", error.message);
    }
  }, []);

  const logActivity = useCallback(
    (
      action: string,
      itemType: string,
      itemId?: string | null,
      metadata?: Record<string, unknown>
    ) => {
      if (!user) return;

      queue.current.push({
        actor_id: user.id,
        action,
        item_type: itemType,
        item_id: itemId ?? null,
        metadata: metadata ?? {},
      });

      // Reset debounce timer
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, BATCH_DELAY);
    },
    [user, flush]
  );

  return { logActivity };
}
