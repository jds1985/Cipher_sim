import Stripe from "stripe";

let stripe = null;

export function getStripe() {
  if (stripe) return stripe;

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });

  return stripe;
}

export const PRICE_TO_TIER = {
  [process.env.STRIPE_PRICE_ID_PRO]: "pro",
  [process.env.STRIPE_PRICE_ID_BUILDER]: "builder",
};

export function getTierFromPriceId(priceId) {
  if (!priceId) return "free";
  return PRICE_TO_TIER[priceId] || "free";
}
