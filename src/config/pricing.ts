export type PricingTier = {
  name: string;
  description: string;
  monthlyPrice: number | null; // null = custom
  yearlyPrice: number | null;
  features: string[];
  highlighted: boolean;
  cta: string;
  ctaLink: string;
  badge?: string;
};

export const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    description: "For individuals getting started",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "Up to 100 items",
      "Basic AI features",
      "Community support",
      "1 workspace",
    ],
    highlighted: false,
    cta: "Get Started",
    ctaLink: "/auth",
  },
  {
    name: "Pro",
    description: "For growing teams that need more",
    monthlyPrice: 19,
    yearlyPrice: 15,
    features: [
      "Unlimited items",
      "Advanced AI features",
      "Priority support",
      "Unlimited workspaces",
      "API access",
      "Team collaboration",
    ],
    highlighted: true,
    cta: "Start Free Trial",
    ctaLink: "/auth",
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    description: "For organizations at scale",
    monthlyPrice: null,
    yearlyPrice: null,
    features: [
      "Custom AI models",
      "SSO & SAML",
      "Dedicated support",
      "SLA guarantee",
    ],
    highlighted: false,
    cta: "Contact Sales",
    ctaLink: "/docs",
  },
];

export type ComparisonFeature = {
  name: string;
  free: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
};

export const comparisonFeatures: ComparisonFeature[] = [
  { name: "Items", free: "Up to 100", pro: "Unlimited", enterprise: "Unlimited" },
  { name: "Workspaces", free: "1", pro: "Unlimited", enterprise: "Unlimited" },
  { name: "Basic AI features", free: true, pro: true, enterprise: true },
  { name: "Advanced AI features", free: false, pro: true, enterprise: true },
  { name: "Custom AI models", free: false, pro: false, enterprise: true },
  { name: "API access", free: false, pro: true, enterprise: true },
  { name: "Team collaboration", free: false, pro: true, enterprise: true },
  { name: "SSO & SAML", free: false, pro: false, enterprise: true },
  { name: "Community support", free: true, pro: true, enterprise: true },
  { name: "Priority support", free: false, pro: true, enterprise: true },
  { name: "Dedicated support", free: false, pro: false, enterprise: true },
  { name: "SLA guarantee", free: false, pro: false, enterprise: true },
  { name: "Audit logs", free: false, pro: "Coming soon", enterprise: true },
  { name: "Custom integrations", free: false, pro: "Coming soon", enterprise: true },
];

export const pricingFAQs = [
  {
    question: "Can I change plans anytime?",
    answer:
      "Yes! You can upgrade, downgrade, or cancel your plan at any time. Changes take effect at the start of your next billing cycle. When upgrading, you'll be prorated for the remainder of the current period.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards (Visa, Mastercard, American Express), as well as PayPal. Enterprise customers can also pay via invoice and bank transfer.",
  },
  {
    question: "Is there a refund policy?",
    answer:
      "Absolutely. We offer a 30-day money-back guarantee on all paid plans. If you're not satisfied, contact our support team within 30 days of purchase for a full refund — no questions asked.",
  },
  {
    question: "What happens when I exceed my limits?",
    answer:
      "On the Free plan, you'll receive a notification when you're approaching your limit. You won't lose any data — you simply won't be able to create new items until you upgrade or remove existing ones.",
  },
  {
    question: "Do you offer discounts for startups or nonprofits?",
    answer:
      "Yes! We offer special pricing for qualified startups, nonprofits, and educational institutions. Reach out to our sales team to learn more about eligibility.",
  },
];
