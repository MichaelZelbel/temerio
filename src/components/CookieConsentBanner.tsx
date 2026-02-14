import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

const STORAGE_KEY = "cookie-consent";

type ConsentValue = "all" | "essential" | null;

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = (value: "all" | "essential") => {
    localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 animate-fade-in">
      <div className="container max-w-4xl">
        <div className="rounded-2xl border bg-card shadow-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium">We use cookies 🍪</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We use essential cookies to make our site work and optional cookies to improve your experience.{" "}
              <Link to="/cookies" className="text-primary hover:underline">
                Learn more
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => accept("essential")}>
              Essential Only
            </Button>
            <Button size="sm" onClick={() => accept("all")}>
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
