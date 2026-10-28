// © 2026 Cipher CTS. All Rights Reserved.
// Proprietary and confidential. Not covered by the free evaluation license.
// POST /api/webhook  ->  verify Stripe signature, then fulfil paid HLC commercial licences:
// make a signed one-time download link and email it (once per Checkout Session).
import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { DEFAULT_SITE_ORIGIN, DOWNLOAD_FILE_KEY, DOWNLOAD_TTL_SECONDS } from "./config.js";
import { purchaseByKey } from "../../products.js";
import { buildEmail, sendEmail } from "./email.js";
import { readRawBody, sendJson } from "./http.js";
import { createStore } from "./store.js";
import { signToken } from "./token.js";

const DONE_TTL = 90 * 24 * 3600; // remember "email sent" for 90 days (Stripe retries last 3 days)
const PENDING_TTL = 10 * 60;

export function createWebhookHandler(deps = {}) {
  const env = () => deps.env || process.env;
  const fetchImpl = () => deps.fetch || globalThis.fetch;
  const verify = deps.verify || ((raw, sig, secret) => Stripe.webhooks.constructEvent(raw, sig, secret));
  const storeFor = () => (deps.store !== undefined ? deps.store : createStore(env(), fetchImpl()));
  const now = deps.now || (() => Math.floor(Date.now() / 1000));

  async function fulfil(session) {
    const e = env();
    // The Stripe session says which product was bought (metadata.product); the matching product's own package is delivered.
    const cfg = purchaseByKey(session.metadata?.product);
    if (!cfg) return { status: 200, body: { received: true, ignored: "other product" } };
    const isHlc = cfg.id === "hlc";
    if (session.payment_status !== "paid") return { status: 200, body: { received: true, ignored: "not paid" } };

    const to = session.customer_details?.email || session.customer_email;
    // Fail loudly (500) when the system is not fully configured: Stripe retries, nothing is silently lost.
    const missing = ["DOWNLOAD_LINK_SECRET", cfg.packageUrlVar, "RESEND_API_KEY", "FROM_EMAIL"].filter((k) => !e[k]);
    const store = storeFor();
    if (!store) missing.push("KV_REST_API_URL/KV_REST_API_TOKEN");
    if (missing.length) {
      console.error(`[${cfg.id} webhook] cannot fulfil, missing configuration:`, missing.join(", "));
      return { status: 500, body: { error: "Licensing is not fully configured" } };
    }
    if (!to) {
      console.error("[hlc webhook] session has no customer email:", session.id);
      return { status: 500, body: { error: "No customer email on session" } };
    }

    const key = `${cfg.kv}:email:${session.id}`;
    const claimed = await store.setNX(key, "pending", PENDING_TTL);
    if (!claimed) {
      const state = await store.get(key);
      if (state === "sent") return { status: 200, body: { received: true, duplicate: true } };
      console.warn("[hlc webhook] another delivery of this session is in progress:", session.id);
      return { status: 500, body: { error: "In progress, retry later" } };
    }

    try {
      const exp = now() + DOWNLOAD_TTL_SECONDS;
      const token = signToken({ sid: session.id, file: DOWNLOAD_FILE_KEY, ...(isHlc ? {} : { prod: cfg.id }), exp, jti: randomUUID() }, e.DOWNLOAD_LINK_SECRET);
      const site = (e.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_ORIGIN).replace(/\/+$/, "");
      const link = `${site}/api/download?token=${encodeURIComponent(token)}`;
      const mail = buildEmail({ link, expiresAt: exp, product: cfg.id });
      await sendEmail({ to, ...mail, idempotencyKey: `${isHlc ? "hlc" : cfg.id}-license-${session.id}` }, e, fetchImpl());
      await store.set(key, "sent", DONE_TTL);
      console.log(`[${cfg.id} webhook] licence email sent for session`, session.id);
      return { status: 200, body: { received: true } };
    } catch (err) {
      try {
        await store.del(key); // let the Stripe retry send it
      } catch {}
      console.error("[hlc webhook] delivery failed for", session.id, "-", err?.message);
      return { status: 500, body: { error: "Delivery failed, will retry" } };
    }
  }

  return async function webhookHandler(req, res) {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return sendJson(res, 405, { error: "Method not allowed" });
    }
    const secret = env().STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      console.error("[hlc webhook] STRIPE_WEBHOOK_SECRET is not set");
      return sendJson(res, 503, { error: "Webhook not configured" });
    }
    const sig = req.headers["stripe-signature"];
    if (!sig) return sendJson(res, 400, { error: "Missing Stripe-Signature header" });

    let event;
    try {
      const raw = await readRawBody(req);
      event = verify(raw, sig, secret);
    } catch (err) {
      console.warn("[hlc webhook] signature verification failed:", err?.message);
      return sendJson(res, 400, { error: "Invalid signature" });
    }

    let result;
    try {
      switch (event.type) {
        case "checkout.session.completed":
        case "checkout.session.async_payment_succeeded":
          result = await fulfil(event.data.object);
          break;
        case "invoice.paid": {
          const inv = event.data.object;
          console.log("[hlc webhook] invoice.paid (renewal logging only):", inv.id, inv.billing_reason);
          result = { status: 200, body: { received: true } };
          break;
        }
        default:
          result = { status: 200, body: { received: true, ignored: event.type } };
      }
    } catch (err) {
      console.error("[hlc webhook] unexpected error:", err?.message);
      result = { status: 500, body: { error: "Internal error" } };
    }
    return sendJson(res, result.status, result.body);
  };
}
