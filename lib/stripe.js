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
