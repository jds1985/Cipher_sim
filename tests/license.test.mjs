// © 2026 Cipher CTS. All Rights Reserved.
// Proprietary and confidential. Not covered by the free evaluation license.
// Unit/integration tests with mocks only: no network, no real Stripe, no real secrets.
import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Stripe from "stripe";
import { createCheckoutHandler } from "../lib/hlc/license/checkout.js";
import { createWebhookHandler } from "../lib/hlc/license/webhook.js";
import { createDownloadHandler } from "../lib/hlc/license/download.js";
import { signToken, verifyToken } from "../lib/hlc/license/token.js";
import { createStore } from "../lib/hlc/license/store.js";
import { isAllowedOrigin, validateRedirect } from "../lib/hlc/license/origins.js";
import { FakeRes, jsonReq, rawReq, memoryStore } from "./helpers.mjs";

const SECRET = "whsec_test_secret_for_unit_tests_only";
const DL_SECRET = "unit-test-download-secret";
const ENV = {
  STRIPE_SECRET_KEY: "sk_test_dummy",
  STRIPE_WEBHOOK_SECRET: SECRET,
  DOWNLOAD_LINK_SECRET: DL_SECRET,
  PRODUCTION_PACKAGE_URL: "https://private.example.test/package.zip?sig=abc",
  RESEND_API_KEY: "re_test_dummy",
  FROM_EMAIL: "licensing@ciphercts.com",
  NEXT_PUBLIC_SITE_URL: "https://ciphercts.com",
  KV_REST_API_URL: "https://kv.example.test",
  KV_REST_API_TOKEN: "kv_dummy",
};

// ---------------------------------------------------------------- checkout
function checkoutWith(env = ENV) {
  const calls = [];
  const handler = createCheckoutHandler({
    env,
    getStripe: () => ({ checkout: { sessions: { create: async (p) => (calls.push(p), { id: "cs_test_123", url: "https://checkout.stripe.com/c/pay/cs_test_123" }) } } }),
  });
  return { handler, calls };
}

test("checkout: valid POST builds a $499/yr subscription session with adjustable quantity 1-50", async () => {
  const { handler, calls } = checkoutWith();
  const res = new FakeRes();
  await handler(jsonReq({ body: {}, headers: { origin: "https://ciphercts.com" } }), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { url: "https://checkout.stripe.com/c/pay/cs_test_123", id: "cs_test_123" });
  const p = calls[0];
  assert.equal(p.mode, "subscription");
  const li = p.line_items[0];
  assert.equal(li.price_data.unit_amount, 49900);
  assert.equal(li.price_data.currency, "usd");
  assert.equal(li.price_data.recurring.interval, "year");
  assert.equal(li.price_data.product_data.name, "HLC Commercial Production License");
  assert.deepEqual(li.adjustable_quantity, { enabled: true, minimum: 1, maximum: 50 });
  assert.equal(li.quantity, 1);
  assert.equal(p.metadata.product, "hlc-commercial");
  assert.ok(p.success_url.startsWith("https://ciphercts.com/hlc?license=success"));
  assert.ok(p.success_url.includes("{CHECKOUT_SESSION_ID}"));
  assert.ok(p.cancel_url.startsWith("https://ciphercts.com/hlc?license=cancelled"));
  // Robust consent: the terms link is on the Checkout page by default; no dashboard setup needed.
  assert.match(p.custom_text.submit.message, /Cipher CTS Commercial License Terms: https:\/\/ciphercts\.com\/hlc\/commercial-terms/);
  assert.equal(p.consent_collection, undefined);
  assert.ok(!/apa[c]he/i.test(JSON.stringify(p)));
});

test("checkout: STRIPE_REQUIRE_TERMS_CHECKBOX=true adds required terms consent with the terms link", async () => {
  const { handler, calls } = checkoutWith({ ...ENV, STRIPE_REQUIRE_TERMS_CHECKBOX: "true" });
  const res = new FakeRes();
  await handler(jsonReq({ body: {}, headers: { origin: "https://ciphercts.com" } }), res);
  assert.equal(res.statusCode, 200);
  const p = calls[0];
  assert.deepEqual(p.consent_collection, { terms_of_service: "required" });
  assert.match(p.custom_text.terms_of_service_acceptance.message, /https:\/\/ciphercts\.com\/hlc\/commercial-terms/);
  assert.match(p.custom_text.submit.message, /commercial-terms/);
});

test("checkout: if Stripe rejects the checkbox (no Terms URL in dashboard) it retries link-only and still succeeds", async () => {
  const calls = [];
  const handler = createCheckoutHandler({
    env: { ...ENV, STRIPE_REQUIRE_TERMS_CHECKBOX: "true" },
    getStripe: () => ({ checkout: { sessions: { create: async (p) => {
      calls.push(p);
      if (p.consent_collection) throw new Error("You cannot collect consent to terms of service until a Terms of Service URL is set in your Dashboard.");
      return { id: "cs_test_retry", url: "https://checkout.stripe.com/c/pay/cs_test_retry" };
    } } } }),
  });
  const res = new FakeRes();
  await handler(jsonReq({ body: {} }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.id, "cs_test_retry");
  assert.equal(calls.length, 2);
  assert.equal(calls[1].consent_collection, undefined);
  assert.match(calls[1].custom_text.submit.message, /commercial-terms/);
});

test("checkout: only POST (405 + Allow)", async () => {
  const { handler } = checkoutWith();
  for (const method of ["GET", "PUT", "DELETE"]) {
    const res = new FakeRes();
    await handler(jsonReq({ method }), res);
    assert.equal(res.statusCode, 405);
    assert.equal(res.headers.allow, "POST");
  }
});

test("checkout: missing STRIPE_SECRET_KEY -> friendly 503, no crash", async () => {
  const handler = createCheckoutHandler({ env: { ...ENV, STRIPE_SECRET_KEY: undefined } });
  const res = new FakeRes();
  await handler(jsonReq({ body: {} }), res);
  assert.equal(res.statusCode, 503);
  assert.match(res.body.error, /not available yet/i);
});

test("checkout: body success/cancel URLs honoured only when on the allow-list", async () => {
  const { handler, calls } = checkoutWith();
  const res = new FakeRes();
  await handler(jsonReq({ body: { success_url: "https://www.ciphercts.com/hlc?ok=1", cancel_url: "http://localhost:3000/hlc" } }), res);
  assert.equal(calls[0].success_url, "https://www.ciphercts.com/hlc?ok=1");
  assert.equal(calls[0].cancel_url, "http://localhost:3000/hlc");
  for (const bad of ["https://evil.example/steal", "https://ciphercts.com.evil.example/x", "https://user:pw@ciphercts.com/", "javascript:alert(1)", "//evil.example", "http://ciphercts.com@evil.example/"]) {
    const r = new FakeRes();
    await handler(jsonReq({ body: { success_url: bad, cancel_url: bad }, headers: { origin: "https://evil.example" } }), r);
    assert.equal(r.statusCode, 200);
    const last = calls[calls.length - 1];
    assert.ok(last.success_url.startsWith("https://ciphercts.com/hlc?license=success"), `${bad} -> ${last.success_url}`);
    assert.ok(last.cancel_url.startsWith("https://ciphercts.com/hlc?license=cancelled"), bad);
  }
});

test("checkout: Vercel preview hosts are allowed, random vercel.app hosts are not", () => {
  assert.equal(isAllowedOrigin("https://cipher-sim-git-hlc-stripe-licensing-james-saenz-s-projects.vercel.app", {}), true);
  assert.equal(isAllowedOrigin("https://evil-james-saenz-s-projects.vercel.app", {}), false);
  assert.equal(isAllowedOrigin("https://abc.vercel.app", { VERCEL_URL: "abc.vercel.app" }), true);
  assert.equal(validateRedirect("https://ciphercts.com/x", {}), "https://ciphercts.com/x");
  assert.equal(validateRedirect("https://nope.example/x", {}), null);
});

test("checkout: quantity validation and Stripe failure -> 400 / 502 (no secret leaked)", async () => {
  const { handler } = checkoutWith();
  for (const q of [0, 51, 2.5, "abc"]) {
    const res = new FakeRes();
    await handler(jsonReq({ body: { quantity: q } }), res);
    assert.equal(res.statusCode, 400, String(q));
  }
  const boom = createCheckoutHandler({ env: ENV, getStripe: () => ({ checkout: { sessions: { create: async () => { throw new Error("sk_test_dummy exploded"); } } } }) });
  const res = new FakeRes();
  await boom(jsonReq({ body: {} }), res);
  assert.equal(res.statusCode, 502);
  assert.ok(!JSON.stringify(res.body).includes("sk_test"));
});

// ---------------------------------------------------------------- webhook
function eventFor(type, object, id = "evt_1") {
  return JSON.stringify({ id, object: "event", api_version: "2025-02-24.acacia", type, data: { object } });
}
function signedReq(payload, secret = SECRET) {
  const header = Stripe.webhooks.generateTestHeaderString({ payload, secret });
  return rawReq({ payload, headers: { "stripe-signature": header } });
}
const paidSession = (over = {}) => ({
  id: "cs_test_paid_1",
  object: "checkout.session",
  payment_status: "paid",
  mode: "subscription",
  metadata: { product: "hlc-commercial" },
  customer_details: { email: "buyer@example.test" },
  ...over,
});
function webhookWith(over = {}) {
  const store = over.store !== undefined ? over.store : memoryStore();
  const sent = [];
  const fetch = over.fetch || (async (url, init) => (sent.push({ url, init, body: JSON.parse(init.body) }), { ok: true, status: 200, json: async () => ({ id: "em_1" }) }));
  const handler = createWebhookHandler({ env: over.env || ENV, store, fetch, now: () => 1_800_000_000 });
  return { handler, store, sent };
}

test("webhook: bad / missing signature -> 400 and nothing sent", async () => {
  const { handler, sent } = webhookWith();
  const payload = eventFor("checkout.session.completed", paidSession());
  let res = new FakeRes();
  await handler(signedReq(payload, "whsec_wrong_secret"), res);
  assert.equal(res.statusCode, 400);
  res = new FakeRes();
  await handler(rawReq({ payload, headers: {} }), res);
  assert.equal(res.statusCode, 400);
  res = new FakeRes();
  await handler(rawReq({ payload, headers: { "stripe-signature": "t=1,v1=deadbeef" } }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(sent.length, 0);
});

test("webhook: tampered body fails verification", async () => {
  const { handler, sent } = webhookWith();
  const good = eventFor("checkout.session.completed", paidSession());
  const header = Stripe.webhooks.generateTestHeaderString({ payload: good, secret: SECRET });
  const res = new FakeRes();
  await handler(rawReq({ payload: good.replace("buyer@example.test", "attacker@example.test"), headers: { "stripe-signature": header } }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(sent.length, 0);
});

test("webhook: paid completed event -> exactly one Resend email with a valid signed one-time link", async () => {
  const { handler, sent, store } = webhookWith();
  const res = new FakeRes();
  await handler(signedReq(eventFor("checkout.session.completed", paidSession())), res);
  assert.equal(res.statusCode, 200);
  assert.equal(sent.length, 1);
  const { url, init, body } = sent[0];
  assert.equal(url, "https://api.resend.com/emails");
  assert.equal(init.headers.Authorization, "Bearer re_test_dummy");
  assert.deepEqual(body.to, ["buyer@example.test"]);
  assert.equal(body.from, "licensing@ciphercts.com");
  assert.match(body.text, /ONE time/);
  const m = body.text.match(/https:\/\/ciphercts\.com\/api\/download\?token=([^\s]+)/);
  assert.ok(m, "link in text");
  assert.ok(body.html.includes("token="));
  const v = verifyToken(decodeURIComponent(m[1]), DL_SECRET, 1_800_000_000);
  assert.equal(v.ok, true);
  assert.equal(v.payload.sid, "cs_test_paid_1");
  assert.equal(v.payload.exp, 1_800_000_000 + 72 * 3600);
  assert.equal(store.m.get("hlc:email:cs_test_paid_1"), "sent");
  assert.ok(!JSON.stringify(body).includes("private.example.test"), "package URL never emailed");
  assert.ok(body.text.includes("https://ciphercts.com/hlc/commercial-terms"), "terms link in text");
  assert.ok(body.html.includes("https://ciphercts.com/hlc/commercial-terms"), "terms link in html");
  assert.ok(body.text.includes("© 2026 Cipher CTS. All Rights Reserved."));
  assert.ok(body.html.includes("© 2026 Cipher CTS. All Rights Reserved."));
  assert.ok(!/apa[c]he/i.test(body.text + body.html));
});

test("webhook: duplicate event (same session, even new event id) -> no second email", async () => {
  const { handler, sent } = webhookWith();
  for (const id of ["evt_1", "evt_1", "evt_2"]) {
    const res = new FakeRes();
    await handler(signedReq(eventFor("checkout.session.completed", paidSession(), id)), res);
    assert.equal(res.statusCode, 200);
  }
  assert.equal(sent.length, 1);
});

test("webhook: unpaid session and other products are ignored (200, no email)", async () => {
  const { handler, sent } = webhookWith();
  for (const s of [paidSession({ payment_status: "unpaid" }), paidSession({ id: "cs_2", metadata: { product: "shopstream" } }), paidSession({ id: "cs_3", metadata: {} })]) {
    const res = new FakeRes();
    await handler(signedReq(eventFor("checkout.session.completed", s)), res);
    assert.equal(res.statusCode, 200);
  }
  assert.equal(sent.length, 0);
});

test("webhook: invoice.paid (renewal) only logs, never emails; unknown events are acknowledged", async () => {
  const { handler, sent } = webhookWith();
  let res = new FakeRes();
  await handler(signedReq(eventFor("invoice.paid", { id: "in_1", billing_reason: "subscription_cycle" })), res);
  assert.equal(res.statusCode, 200);
  res = new FakeRes();
  await handler(signedReq(eventFor("customer.created", { id: "cus_1" })), res);
  assert.equal(res.statusCode, 200);
  assert.equal(sent.length, 0);
});

test("webhook: email failure -> 500 so Stripe retries, claim released, retry then succeeds once", async () => {
  let fail = true;
  const sent = [];
  const fetch = async (url, init) => {
    if (fail) return { ok: false, status: 503, json: async () => ({}) };
    sent.push(1);
    return { ok: true, status: 200, json: async () => ({}) };
  };
  const { handler, store } = webhookWith({ fetch });
  const payload = eventFor("checkout.session.completed", paidSession());
  let res = new FakeRes();
  await handler(signedReq(payload), res);
  assert.equal(res.statusCode, 500);
  assert.equal(store.m.has("hlc:email:cs_test_paid_1"), false);
  fail = false;
  res = new FakeRes();
  await handler(signedReq(payload), res);
  assert.equal(res.statusCode, 200);
  assert.equal(sent.length, 1);
});

test("webhook: missing email / store / package config -> 500 (not swallowed), no email", async () => {
  const payload = eventFor("checkout.session.completed", paidSession());
  for (const over of [
    { env: { ...ENV, RESEND_API_KEY: undefined } },
    { env: { ...ENV, FROM_EMAIL: undefined } },
    { env: { ...ENV, DOWNLOAD_LINK_SECRET: undefined } },
    { env: { ...ENV, PRODUCTION_PACKAGE_URL: undefined } },
    { store: null },
  ]) {
    const { handler, sent } = webhookWith(over);
    const res = new FakeRes();
    await handler(signedReq(payload), res);
    assert.equal(res.statusCode, 500, JSON.stringify(Object.keys(over)));
    assert.equal(sent.length, 0);
  }
});

test("webhook: only POST; missing STRIPE_WEBHOOK_SECRET -> 503", async () => {
  const { handler } = webhookWith();
  let res = new FakeRes();
  await handler(rawReq({ method: "GET" }), res);
  assert.equal(res.statusCode, 405);
  const h2 = createWebhookHandler({ env: { ...ENV, STRIPE_WEBHOOK_SECRET: undefined }, store: memoryStore() });
  res = new FakeRes();
  await h2(signedReq("{}"), res);
  assert.equal(res.statusCode, 503);
});

test("webhook config disables the body parser (pages/api/webhook.js)", async () => {
  const mod = await import("../pages/api/webhook.js");
  assert.equal(mod.config.api.bodyParser, false);
  assert.equal(typeof mod.default, "function");
});

// ---------------------------------------------------------------- download
const tok = (over = {}, secret = DL_SECRET) => signToken({ sid: "cs_1", file: "production", exp: 1_800_000_000 + 3600, jti: "jti-1", ...over }, secret);
function dl(over = {}) {
  const store = over.store !== undefined ? over.store : memoryStore();
  return { store, handler: createDownloadHandler({ env: over.env || ENV, store, now: () => 1_800_000_000 }) };
}
const post = (token) => jsonReq({ method: "POST", body: { token } });
const get = (token) => jsonReq({ method: "GET", query: { token } });

test("download: valid link works once, the second use is rejected (410)", async () => {
  const { handler } = dl();
  const t = tok();
  let res = new FakeRes();
  await handler(post(t), res);
  assert.equal(res.statusCode, 302);
  assert.equal(res.redirectTo, ENV.PRODUCTION_PACKAGE_URL);
  res = new FakeRes();
  await handler(post(t), res);
  assert.equal(res.statusCode, 410);
  assert.match(res.body, /already used/i);
  assert.equal(res.redirectTo, null);
});

test("download: GET shows the confirmation page and does NOT consume the link", async () => {
  const { handler } = dl();
  const t = tok();
  for (let i = 0; i < 3; i++) {
    const res = new FakeRes();
    await handler(get(t), res);
    assert.equal(res.statusCode, 200);
    assert.match(res.body, /Download now/);
    assert.equal(res.redirectTo, null);
  }
  const res = new FakeRes();
  await handler(post(t), res);
  assert.equal(res.statusCode, 302);
  const after = new FakeRes();
  await handler(get(t), after);
  assert.equal(after.statusCode, 410);
});

test("download: concurrent clicks, exactly one wins", async () => {
  const { handler } = dl();
  const t = tok({ jti: "race" });
  const results = await Promise.all([1, 2, 3, 4, 5].map(async () => { const r = new FakeRes(); await handler(post(t), r); return r.statusCode; }));
  assert.equal(results.filter((s) => s === 302).length, 1);
  assert.equal(results.filter((s) => s === 410).length, 4);
});

test("download: expired link rejected (410) and not served", async () => {
  const { handler } = dl();
  const res = new FakeRes();
  await handler(post(tok({ exp: 1_800_000_000 - 1 })), res);
  assert.equal(res.statusCode, 410);
  assert.match(res.body, /expired/i);
  assert.equal(res.redirectTo, null);
});

test("download: tampered / wrong-secret / garbage tokens rejected (400)", async () => {
  const { handler } = dl();
  const good = tok();
  const [body, sig] = good.split(".");
  const forgedBody = Buffer.from(JSON.stringify({ sid: "cs_1", file: "production", exp: 4_000_000_000, jti: "jti-1" })).toString("base64url");
  for (const bad of [`${forgedBody}.${sig}`, `${body}.${sig.slice(0, -2)}AA`, tok({}, "another-secret"), "garbage", "", undefined, "a.b.c"]) {
    const res = new FakeRes();
    await handler(post(bad), res);
    assert.equal(res.statusCode, 400, String(bad));
    assert.equal(res.redirectTo, null);
  }
});

test("download: FAILS CLOSED with no KV store, no secret or no package location (503, link not consumed)", async () => {
  const t = tok();
  for (const over of [{ store: null }, { env: { ...ENV, DOWNLOAD_LINK_SECRET: undefined } }, { env: { ...ENV, PRODUCTION_PACKAGE_URL: undefined } }]) {
    const { handler } = dl(over);
    for (const req of [get(t), post(t)]) {
      const res = new FakeRes();
      await handler(req, res);
      assert.equal(res.statusCode, 503);
      assert.equal(res.redirectTo, null);
    }
  }
  const noKvEnv = createDownloadHandler({ env: { ...ENV, KV_REST_API_URL: undefined, KV_REST_API_TOKEN: undefined } });
  const res = new FakeRes();
  await noKvEnv(post(t), res);
  assert.equal(res.statusCode, 503);
});

test("download: store outage fails closed (503)", async () => {
  const broken = { async setNX() { throw new Error("down"); }, async get() { throw new Error("down"); }, async set() {}, async del() {} };
  const { handler } = dl({ store: broken });
  const res = new FakeRes();
  await handler(post(tok()), res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.redirectTo, null);
});

test("download: private file path is streamed with attachment headers; a missing file gives the link back", async () => {
  const dir = mkdtempSync(join(tmpdir(), "hlc-"));
  const file = join(dir, "pkg.bin");
  writeFileSync(file, "PRIVATE-PACKAGE-BYTES");
  const { handler } = dl({ env: { ...ENV, PRODUCTION_PACKAGE_URL: file } });
  const res = new FakeRes();
  await handler(post(tok({ jti: "file-1" })), res);
  await new Promise((r) => res.on("finish", r));
  assert.equal(res.statusCode, 200);
  assert.equal(Buffer.concat(res.chunks).toString(), "PRIVATE-PACKAGE-BYTES");
  assert.match(res.headers["content-disposition"], /attachment; filename="pkg\.bin"/);

  const { handler: h2, store } = dl({ env: { ...ENV, PRODUCTION_PACKAGE_URL: join(dir, "missing.bin") } });
  const r2 = new FakeRes();
  await h2(post(tok({ jti: "file-2" })), r2);
  assert.equal(r2.statusCode, 503);
  assert.equal(store.m.has("hlc:dl:file-2"), false);
});

// ---------------------------------------------------------------- store (Upstash REST)
test("store: null without env; REST commands built correctly", async () => {
  assert.equal(createStore({}), null);
  const calls = [];
  const s = createStore({ KV_REST_API_URL: "https://kv.example.test", KV_REST_API_TOKEN: "t" }, async (url, init) => (calls.push({ url, init }), { ok: true, json: async () => ({ result: "OK" }) }));
  assert.equal(await s.setNX("k", "v", 60), true);
  assert.deepEqual(JSON.parse(calls[0].init.body), ["SET", "k", "v", "NX", "EX", "60"]);
  assert.equal(calls[0].init.headers.Authorization, "Bearer t");
  const s2 = createStore({ KV_REST_API_URL: "https://kv.example.test", KV_REST_API_TOKEN: "t" }, async () => ({ ok: true, json: async () => ({ result: null }) }));
  assert.equal(await s2.setNX("k", "v", 60), false);
  const s3 = createStore({ KV_REST_API_URL: "https://kv.example.test", KV_REST_API_TOKEN: "t" }, async () => ({ ok: false, status: 500, json: async () => ({}) }));
  await assert.rejects(() => s3.get("k"));
});
