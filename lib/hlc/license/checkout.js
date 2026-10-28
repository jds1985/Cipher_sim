// © 2026 Cipher CTS. All Rights Reserved.
// Proprietary and confidential. Not covered by the free evaluation license.
// POST /api/checkout  ->  Stripe Checkout Session for the HLC Commercial Production License
// ($499 per asset per year, 1-50 assets chosen on the Stripe page). Test-mode compatible.
import { getStripe } from "../../stripe.js";
import { CURRENCY, MAX_ASSETS, MIN_ASSETS, PRODUCT_KEY, PRODUCT_NAME, UNIT_AMOUNT_CENTS, isPurchaseEnabled } from "./config.js";
import { pickSiteOrigin, validateRedirect } from "./origins.js";
import { sendJson } from "./http.js";

export const TERMS_PATH = "/hlc/commercial-terms";

/** Text shown on the Stripe page. A plain link in the submit message ALWAYS works (no dashboard setting needed). */
export function termsCustomText(site, withCheckbox) {
  const url = `${site}${TERMS_PATH}`;
  const text = {
    submit: { message: `By completing this purchase you agree to the Cipher CTS Commercial License Terms: ${url}` },
  };
  if (withCheckbox) text.terms_of_service_acceptance = { message: `I agree to the Cipher CTS Commercial License Terms: ${url}` };
  return text;
}

export function createCheckoutHandler(deps = {}) {
  const env = () => deps.env || process.env;
  const stripeFor = deps.getStripe || getStripe;

  return async function checkoutHandler(req, res) {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return sendJson(res, 405, { error: "Method not allowed. Use POST." });
    }
    const e = env();
    // Master switch: nothing can start a Stripe session unless selling has been switched on on purpose.
    if (!isPurchaseEnabled(e)) {
      return sendJson(res, 503, { error: "Commercial licenses are not open for purchase yet. Nothing was charged. Questions: team@ciphercts.com." });
    }
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

    // Default (robust): the terms link is in custom_text.submit, which needs no dashboard setup.
    // Optional: STRIPE_REQUIRE_TERMS_CHECKBOX=true adds Stripe's required "I agree" checkbox. Stripe only accepts that
    // once a Terms of Service URL is saved in the Stripe Dashboard, so if Stripe refuses it we retry once without it.
    const wantCheckbox = String(e.STRIPE_REQUIRE_TERMS_CHECKBOX || "").toLowerCase() === "true";

    try {
      const stripe = stripeFor();
      const build = (withCheckbox) => ({
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
        custom_text: termsCustomText(site, withCheckbox),
        ...(withCheckbox ? { consent_collection: { terms_of_service: "required" } } : {}),
      });
      let session;
      try {
        session = await stripe.checkout.sessions.create(build(wantCheckbox));
      } catch (err) {
        if (wantCheckbox && /terms of service/i.test(err && err.message ? err.message : "")) {
          console.error("[hlc checkout] Stripe has no Terms of Service URL yet; continuing with the terms link only.");
          session = await stripe.checkout.sessions.create(build(false));
        } else throw err;
      }
      return sendJson(res, 200, { url: session.url, id: session.id });
    } catch (err) {
      console.error("[hlc checkout] Stripe error:", err && err.type ? `${err.type}: ${err.message}` : err?.message);
      return sendJson(res, 502, { error: "We could not start the checkout. Please try again in a moment, or contact team@ciphercts.com." });
    }
  };
}
