export type PricingTier = {
  name: string;
  description: string;
  price: number;
  features: string[];
  excluded?: string[];
  highlighted: boolean;
  cta: string;
  badge?: string;
};

export const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    description: "Explore Temerio manually, without AI.",
    price: 0,
    features: [
      "Manual event creation",
      "Up to 1 Person",
      "Up to 20 total events",
      "Basic timeline view",
      "Importance & confidence filtering",
    ],
    excluded: [
      "PDF uploads",
      "AI event extraction",
      "AI credits",
      "Review Queue",
    ],
    highlighted: false,
    cta: "Start Free",
  },
  {
    name: "Pro",
    description: "Full Temerio functionality for reconstructing timelines from documents.",
    price: 12,
    features: [
      "Unlimited People",
      "PDF uploads",
      "AI event extraction from documents",
      "10,000 AI credits per month",
      "Review Queue (Suggestions, Major, Merges)",
      "Provenance view (document snippets)",
      "Advanced timeline filtering",
      "Export timeline",
      "Email support",
    ],
    highlighted: true,
    cta: "Upgrade to Pro",
    badge: "Recommended",
  },
];

export type ComparisonFeature = {
  name: string;
  free: boolean | string;
  pro: boolean | string;
};

export const comparisonFeatures: ComparisonFeature[] = [
  { name: "People", free: "1", pro: "Unlimited" },
  { name: "Events", free: "Up to 20", pro: "Unlimited" },
  { name: "Manual event creation", free: true, pro: true },
  { name: "Timeline view", free: true, pro: true },
  { name: "Importance & confidence filtering", free: true, pro: true },
  { name: "PDF uploads", free: false, pro: true },
  { name: "AI event extraction", free: false, pro: true },
  { name: "Monthly AI credits", free: false, pro: "10,000" },
  { name: "Review Queue", free: false, pro: true },
  { name: "Provenance view", free: false, pro: true },
  { name: "Advanced filtering", free: false, pro: true },
  { name: "Export timeline", free: false, pro: true },
  { name: "Email support", free: false, pro: true },
];

export const pricingFAQs = [
  {
    question: "Can I change plans anytime?",
    answer:
      "Yes. You can upgrade or cancel at any time. Changes take effect at the start of your next billing cycle.",
  },
  {
    question: "How do AI credits work?",
    answer:
      "AI credits are used when Temerio extracts events from uploaded documents. Your credit allowance renews monthly with your Pro subscription.",
  },
  {
    question: "What happens when I run out of credits?",
    answer:
      "You can still use Temerio manually — creating events, viewing your timeline, and managing people. AI extraction will pause until your credits renew next month.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards via Stripe.",
  },
  {
    question: "Is there a refund policy?",
    answer:
      "Yes. We offer a 30-day money-back guarantee. If Temerio isn't right for you, contact support for a full refund.",
  },
];
