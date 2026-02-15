import { ReactNode } from "react";

export type DocSection = {
  id: string;
  title: string;
  headings: { id: string; label: string }[];
  content: ReactNode;
};

export type DocGroup = {
  label: string;
  items: { slug: string; title: string }[];
};

export const docNav: DocGroup[] = [
  {
    label: "Getting Started",
    items: [
      { slug: "quick-start", title: "Quick Start Guide" },
      { slug: "creating-account", title: "Creating Your Account" },
      { slug: "dashboard-overview", title: "Dashboard Overview" },
    ],
  },
  {
    label: "Features",
    items: [
      { slug: "ai-insights", title: "AI-Powered Insights" },
      { slug: "collaboration", title: "Seamless Collaboration" },
      { slug: "integrations", title: "Integrations" },
      { slug: "importance", title: "Importance (1–10)" },
    ],
  },
  {
    label: "Account",
    items: [
      { slug: "profile-settings", title: "Profile Settings" },
      { slug: "subscription", title: "Subscription Management" },
      { slug: "team-members", title: "Team Members" },
    ],
  },
  {
    label: "API Reference",
    items: [
      { slug: "api-auth", title: "Authentication" },
      { slug: "api-endpoints", title: "Endpoints" },
      { slug: "api-rate-limits", title: "Rate Limits" },
    ],
  },
  {
    label: "FAQ",
    items: [{ slug: "faq", title: "Common Questions" }],
  },
];

export function getAllSlugs(): string[] {
  return docNav.flatMap((g) => g.items.map((i) => i.slug));
}

export function getAdjacentSlugs(slug: string) {
  const all = docNav.flatMap((g) => g.items);
  const idx = all.findIndex((i) => i.slug === slug);
  return {
    prev: idx > 0 ? all[idx - 1] : null,
    next: idx < all.length - 1 ? all[idx + 1] : null,
  };
}

export function getTitleForSlug(slug: string): string {
  for (const g of docNav) {
    const item = g.items.find((i) => i.slug === slug);
    if (item) return item.title;
  }
  return "Documentation";
}
