import { toast } from "sonner";

/**
 * Convenience toast functions with consistent messaging.
 * Uses Sonner's richColors mode for colored variants.
 */
export const notify = {
  success: (message: string, description?: string) =>
    toast.success(message, { description }),

  error: (message: string, description?: string) =>
    toast.error(message, { description }),

  warning: (message: string, description?: string) =>
    toast.warning(message, { description }),

  info: (message: string, description?: string) =>
    toast.info(message, { description }),

  loading: (message: string) =>
    toast.loading(message),

  dismiss: (id?: string | number) =>
    toast.dismiss(id),

  promise: <T,>(
    promise: Promise<T>,
    msgs: { loading: string; success: string; error: string }
  ) => toast.promise(promise, msgs),

  // ── Standard messages ──
  saved: () => toast.success("Changes saved successfully"),
  saveFailed: () => toast.error("Failed to save changes. Please try again."),
  signInRequired: () => toast.warning("Please sign in to continue"),
  copied: () => toast.success("Copied to clipboard"),
  deleted: () => toast.success("Deleted successfully"),
  deleteFailed: () => toast.error("Failed to delete. Please try again."),
  networkError: () => toast.error("Network error. Check your connection."),
} as const;
