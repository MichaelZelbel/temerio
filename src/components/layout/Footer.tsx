import { Link } from "react-router-dom";

const productLinks = [
  { label: "Pricing", to: "/pricing" },
  { label: "Docs", to: "/docs" },
];

const legalLinks = [
  { label: "Privacy", to: "/privacy" },
  { label: "Terms", to: "/terms" },
  { label: "Cookies", to: "/cookies" },
  { label: "Impressum", to: "/impressum" },
];

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">T</span>
              </div>
              <span className="font-display text-xl font-bold tracking-tight">Temerio</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Turn documents into a structured life timeline.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h6 className="text-sm font-semibold">Product</h6>
            <ul className="space-y-1">
              {productLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center min-h-[44px] sm:min-h-0">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h6 className="text-sm font-semibold">Legal</h6>
            <ul className="space-y-1">
              {legalLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center min-h-[44px] sm:min-h-0">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t flex items-center justify-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Temerio. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
