import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

/* ─── Full Page Spinner ─── */
export function PageLoader({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}

/* ─── Inline Spinner ─── */
export function InlineLoader({ className, size = 16 }: { className?: string; size?: number }) {
  return <Loader2 className={cn("animate-spin text-muted-foreground", className)} style={{ width: size, height: size }} />;
}

/* ─── Card Skeleton ─── */
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

/* ─── Table Skeleton ─── */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-lg border">
      <div className="border-b px-4 py-3 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b last:border-0 px-4 py-3">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className={cn("h-4 flex-1", c === 0 && "max-w-[200px]")} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Text Block Skeleton ─── */
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}
