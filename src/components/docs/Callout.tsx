import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Info, AlertTriangle, Lightbulb } from "lucide-react";

type CalloutVariant = "info" | "warning" | "tip";

const variants: Record<CalloutVariant, { icon: typeof Info; border: string; bg: string; iconColor: string }> = {
  info: { icon: Info, border: "border-info/30", bg: "bg-info/5", iconColor: "text-info" },
  warning: { icon: AlertTriangle, border: "border-warning/30", bg: "bg-warning/5", iconColor: "text-warning" },
  tip: { icon: Lightbulb, border: "border-success/30", bg: "bg-success/5", iconColor: "text-success" },
};

export function Callout({ variant = "info", title, children }: { variant?: CalloutVariant; title?: string; children: ReactNode }) {
  const v = variants[variant];
  const Icon = v.icon;
  return (
    <div className={cn("rounded-xl border p-4 flex gap-3", v.border, v.bg)}>
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", v.iconColor)} />
      <div className="space-y-1 text-sm">
        {title && <p className="font-semibold text-foreground">{title}</p>}
        <div className="text-muted-foreground leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
