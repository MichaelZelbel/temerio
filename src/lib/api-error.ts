import { notify } from "@/lib/notify";

interface ApiErrorOptions {
  maxRetries?: number;
  retryDelay?: number;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

const TRANSIENT_STATUS_CODES = [408, 429, 500, 502, 503, 504];

const USER_MESSAGES: Record<number, string> = {
  400: "Invalid request. Please check your input.",
  401: "Please sign in to continue.",
  403: "You don't have permission for this action.",
  404: "The requested resource was not found.",
  409: "This conflicts with an existing resource.",
  422: "The data provided is invalid.",
  429: "Too many requests. Please wait a moment.",
  500: "Server error. Please try again later.",
  502: "Service temporarily unavailable.",
  503: "Service is under maintenance.",
};

function friendlyMessage(status: number, fallback?: string): string {
  return USER_MESSAGES[status] || fallback || "An unexpected error occurred.";
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Wraps a fetch-like async function with retry logic and consistent error handling.
 */
export async function apiCall<T>(
  fn: () => Promise<{ data: T | null; error: any; status?: number }>,
  options: ApiErrorOptions = {}
): Promise<ApiResponse<T>> {
  const { maxRetries = 2, retryDelay = 1000 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();

      if (result.error) {
        const status = result.error?.status || result.status || 500;
        const message = friendlyMessage(status, result.error?.message);

        // Retry transient errors
        if (TRANSIENT_STATUS_CODES.includes(status) && attempt < maxRetries) {
          await sleep(retryDelay * (attempt + 1));
          continue;
        }

        notify.error(message);
        return { data: null, error: message };
      }

      return { data: result.data, error: null };
    } catch (err: any) {
      if (attempt < maxRetries) {
        await sleep(retryDelay * (attempt + 1));
        continue;
      }
      const message = err?.message || "Network error. Check your connection.";
      notify.error(message);
      return { data: null, error: message };
    }
  }

  return { data: null, error: "Request failed after retries." };
}
