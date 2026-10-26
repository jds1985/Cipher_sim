// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
// POST /api/checkout  ->  Stripe Checkout Session for the HLC Commercial Production License
// ($499 per asset per year, 1-50 assets chosen on the Stripe page). Test-mode compatible.
import { getStripe } from "../../stripe.js";
import { CURRENCY, MAX_ASSETS, MIN_ASSETS, PRODUCT_KEY, PRODUCT_NAME, UNIT_AMOUNT_CENTS } from "./config.js";
import { pickSiteOrigin, validateRedirect } from "./origins.js";
import { sendJson } from "./http.js";

export function createCheckoutHandler(deps = {}) {
  const env = () => deps.env || process.env;
  const stripeFor = deps.getStripe || getStripe;

  return async function checkoutHandler(req, res) {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return sendJson(res, 405, { error: "Method not allowed. Use POST." });
    }
    const e = env();
    if (!e.STRIPE_SECRET_KEY && !deps.getStripe) {
      return sendJson(res, 503, { error: "Online purchase is not available yet. Please contact team@ciphercts.com." });
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const site = pickSiteOrigin(req, e);
    const successUrl = validateRedirect(body.success_url, e) || `${site}/hlc?license=success&session_id={CHECKOUT_SESSION_ID}#license`;
    const cancelUrl = validateRedirect(body.cancel_url, e) || `${site}/hlc?license=cancelled#license`;

    let quantity = 1;
    if (body.quantity !== undefined) {
      const q = Number(body.quantity);
      if (!Number.isInteger(q) || q < MIN_ASSETS || q > MAX_ASSETS) {
        return sendJson(res, 400, { error: `Number of assets must be a whole number from ${MIN_ASSETS} to ${MAX_ASSETS}.` });
      }
      quantity = q;
    }

    try {
      const stripe = stripeFor();
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            price_data: {
              currency: CURRENCY,
              unit_amount: UNIT_AMOUNT_CENTS,
              recurring: { interval: "year" },
              product_data: { name: PRODUCT_NAME, description: "Per asset, billed yearly. Choose the number of assets at checkout." },
            },
            quantity,
            adjustable_quantity: { enabled: true, minimum: MIN_ASSETS, maximum: MAX_ASSETS },
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { product: PRODUCT_KEY },
        subscription_data: { metadata: { product: PRODUCT_KEY } },
      });
      return sendJson(res, 200, { url: session.url, id: session.id });
    } catch (err) {
      console.error("[hlc checkout] Stripe error:", err && err.type ? `${err.type}: ${err.message}` : err?.message);
      return sendJson(res, 502, { error: "We could not start the checkout. Please try again in a moment, or contact team@ciphercts.com." });
    }
  };
}
