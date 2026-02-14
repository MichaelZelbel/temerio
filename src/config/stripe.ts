// Stripe product & price IDs
// Monthly: $19/mo, Yearly: $150/yr ($12.50/mo)

export const STRIPE_CONFIG = {
  pro: {
    monthly: {
      priceId: "price_1SwARkAiLddHHjhksog7rD13",
      productId: "prod_TtyOJLXaidU0LM",
      amount: 19,
      interval: "month" as const,
    },
    yearly: {
      priceId: "price_1SwARzAiLddHHjhkwQN8DL8A",
      productId: "prod_TtyOhH8Z4ZFaM5",
      amount: 150,
      interval: "year" as const,
    },
  },
} as const;

export type BillingCycle = "monthly" | "yearly";

export function getPriceId(cycle: BillingCycle): string {
  return STRIPE_CONFIG.pro[cycle].priceId;
}

export function getProductIds(): string[] {
  return [
    STRIPE_CONFIG.pro.monthly.productId,
    STRIPE_CONFIG.pro.yearly.productId,
  ];
}

/** Check if a Stripe product ID maps to Pro */
export function isProProduct(productId: string | null): boolean {
  if (!productId) return false;
  return getProductIds().includes(productId);
}
