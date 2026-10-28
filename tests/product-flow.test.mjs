// © 2026 Cipher CTS. All Rights Reserved.
// Proprietary and confidential. Not covered by the free evaluation license.
// The paid flow for every sellable product (Cipher, Cipher Bot, Cipher Studio) next to HLC. Mocks only: no network, no real Stripe, no secrets.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Stripe from "stripe";
import { products, purchaseOf, purchaseProducts, purchaseByKey, envSuffix } from "../lib/products.js";
import { isPurchaseEnabled } from "../lib/hlc/license/config.js";
import { createCheckoutHandler } from "../lib/hlc/license/checkout.js";
import { createWebhookHandler } from "../lib/hlc/license/webhook.js";
import { createDownloadHandler } from "../lib/hlc/license/download.js";
import { buildEmail } from "../lib/hlc/license/email.js";
import { signToken, verifyToken } from "../lib/hlc/license/token.js";
import { licenseBannerFromSearch } from "../lib/hlc/license/banner.js";
import { FakeRes, jsonReq, rawReq, memoryStore } from "./helpers.mjs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
const IDS = ["cipher", "cipher-bot", "cipher-studio"];
const SECRET = "whsec_test_secret_for_unit_tests_only";
const DL = "unit-test-download-secret";
const ENV = {
  STRIPE_SECRET_KEY: "sk_test_dummy",
  STRIPE_WEBHOOK_SECRET: SECRET,
  DOWNLOAD_LINK_SECRET: DL,
  PRODUCTION_PACKAGE_URL: "https://private.example.test/hlc.zip?sig=hlc",
  PRODUCTION_PACKAGE_URL_CIPHER_BOT: "https://private.example.test/bot.zip?sig=bot",
  PRODUCTION_PACKAGE_URL_CIPHER: "https://private.example.test/cipher.zip?sig=cipher",
  RESEND_API_KEY: "re_test_dummy",
  FROM_EMAIL: "licensing@ciphercts.com",
  NEXT_PUBLIC_SITE_URL: "https://ciphercts.com",
  KV_REST_API_URL: "https://kv.example.test",
  KV_REST_API_TOKEN: "kv_dummy",
};
const ON = { HLC_PURCHASE_ENABLED: "true", CIPHER_PURCHASE_ENABLED: "true", CIPHER_BOT_PURCHASE_ENABLED: "true", CIPHER_STUDIO_PURCHASE_ENABLED: "true" };

// ---------------------------------------------------------------- registry
test("registry: sellable products are HLC + the three downloadable ones; Concierge (a hosted service) is not", () => {
  assert.deepEqual(purchaseProducts().map((x) => x.id), ["cipher", "cipher-bot", "cipher-studio", "hlc"]);
  assert.equal(purchaseOf("cipher-concierge"), null);
  assert.equal(purchaseOf("nope"), null);
  assert.equal(purchaseOf(undefined), null);
  assert.equal(products.filter((p) => p.sellable).length, 4);
});

test("registry: env var names follow one pattern; HLC keeps its original names", () => {
  assert.equal(envSuffix("cipher-bot"), "CIPHER_BOT");
  for (const id of IDS) {
    const S = envSuffix(id);
    const c = purchaseOf(id);
    assert.equal(c.flag, `${S}_PURCHASE_ENABLED`);
    assert.equal(c.publicFlag, `NEXT_PUBLIC_${S}_PURCHASE_ENABLED`);
    assert.equal(c.packageUrlVar, `PRODUCTION_PACKAGE_URL_${S}`);
    assert.equal(c.priceIdVar, `STRIPE_PRICE_ID_${S}`);
    assert.equal(c.priceLabelVar, `NEXT_PUBLIC_PRICE_LABEL_${S}`);
    assert.equal(c.returnPath, `/${id}`);
    assert.equal(c.key, id);
    assert.equal(c.termsPath, null);
  }
  const h = purchaseOf("hlc");
  assert.equal(h.flag, "HLC_PURCHASE_ENABLED");
  assert.equal(h.publicFlag, "NEXT_PUBLIC_HLC_PURCHASE_ENABLED");
  assert.equal(h.packageUrlVar, "PRODUCTION_PACKAGE_URL");
  assert.equal(h.key, "hlc-commercial");
  assert.equal(h.kv, "hlc");
  assert.equal(h.returnPath, "/hlc");
  assert.equal(h.termsPath, "/hlc/commercial-terms");
  assert.equal(purchaseByKey("hlc-commercial").id, "hlc");
  assert.equal(purchaseByKey("cipher-bot").id, "cipher-bot");
  assert.equal(purchaseByKey("whatever"), null);
  assert.equal(purchaseByKey(undefined), null);
});

test("registry: no price, amount or price text is stored for the other products", () => {
  const src = strip(read("lib/products.js"));
  assert.doesNotMatch(src, /unit_amount|\$\s?\d|\bcents\b/i);
  for (const id of IDS) assert.doesNotMatch(JSON.stringify(products.find((p) => p.slug === id)), /\$\s?\d/);
});

// ---------------------------------------------------------------- switches
test("flags: every product is OFF by default; each flag opens only its own product", () => {
  for (const id of ["hlc", ...IDS]) assert.equal(isPurchaseEnabled({}, id), false, id);
  assert.equal(isPurchaseEnabled({}), false);
  for (const id of ["hlc", ...IDS]) {
    const flag = purchaseOf(id).flag;
    for (const other of ["hlc", ...IDS]) assert.equal(isPurchaseEnabled({ [flag]: "true" }, other), other === id, `${flag} -> ${other}`);
    assert.equal(isPurchaseEnabled({ [flag]: "yes" }, id), false);
    assert.equal(isPurchaseEnabled({ [purchaseOf(id).publicFlag]: "true" }, id), false, "public flag alone never opens the API");
  }
  assert.equal(isPurchaseEnabled(ON, "cipher-concierge"), false);
});

// ---------------------------------------------------------------- checkout
function checkout(env, { recurring = false } = {}) {
  const created = [];
  const retrieved = [];
  const handler = createCheckoutHandler({
    env,
    getStripe: () => ({
      prices: { retrieve: async (id) => (retrieved.push(id), { id, recurring: recurring ? { interval: "year" } : null }) },
      checkout: { sessions: { create: async (p) => (created.push(p), { id: "cs_test_1", url: "https://checkout.stripe.com/c/pay/cs_test_1" }) } },
    }),
  });
  return { handler, created, retrieved };
}
const ask = async (handler, body, headers = { origin: "https://ciphercts.com" }) => {
  const res = new FakeRes();
  await handler(jsonReq({ body, headers }), res);
  return res;
};

test("checkout: every other product is closed by default (503, Stripe never called), and HLC's flag does not open them", async () => {
  for (const id of IDS) {
    for (const env of [{ ...ENV, [purchaseOf(id).priceIdVar]: "price_123456" }, { ...ENV, HLC_PURCHASE_ENABLED: "true", [purchaseOf(id).priceIdVar]: "price_123456" }, { ...ENV, [purchaseOf(id).publicFlag]: "true", [purchaseOf(id).priceIdVar]: "price_123456" }]) {
      const { handler, created, retrieved } = checkout(env);
      const res = await ask(handler, { product: id });
      assert.equal(res.statusCode, 503, id);
      assert.match(res.body.error, /not open for purchase yet/);
      assert.match(res.body.error, /Nothing was charged/);
      assert.match(res.body.error, /team@ciphercts\.com/);
      assert.equal(res.body.url, undefined);
      assert.equal(created.length + retrieved.length, 0);
    }
  }
});

test("checkout: unknown product, Concierge and non-string product -> 400, Stripe never called", async () => {
  const { handler, created } = checkout({ ...ENV, ...ON });
  for (const product of ["nope", "cipher-concierge", "HLC", "", 5, null, {}, ["cipher"]]) {
    const res = await ask(handler, { product });
    assert.equal(res.statusCode, 400, JSON.stringify(product));
  }
  assert.equal(created.length, 0);
});

test("checkout: flag on but no Stripe price id (or a malformed one) -> 503, nothing is invented", async () => {
  for (const bad of [undefined, "", "   ", "prod_123456", "price_", "price_ab", "not a price", "price_123456 ; drop"]) {
    const { handler, created } = checkout({ ...ENV, ...ON, STRIPE_PRICE_ID_CIPHER_BOT: bad });
    const res = await ask(handler, { product: "cipher-bot" });
    assert.equal(res.statusCode, 503, String(bad));
    assert.match(res.body.error, /not available yet/);
    assert.equal(created.length, 0);
  }
});

test("checkout: flag + price id -> session uses ONLY that price id, quantity 1, product metadata, product return URLs", async () => {
  for (const id of IDS) {
    const c = purchaseOf(id);
    const { handler, created, retrieved } = checkout({ ...ENV, ...ON, [c.priceIdVar]: "price_TEST123456" });
    const res = await ask(handler, { product: id, quantity: 7, unit_amount: 1 });
    assert.equal(res.statusCode, 200, id);
    assert.deepEqual(res.body, { url: "https://checkout.stripe.com/c/pay/cs_test_1", id: "cs_test_1" });
    assert.deepEqual(retrieved, ["price_TEST123456"]);
    const p = created[0];
    assert.deepEqual(p.line_items, [{ price: "price_TEST123456", quantity: 1 }]);
    assert.equal(p.mode, "payment"); // one-time price
    assert.deepEqual(p.metadata, { product: id });
    assert.deepEqual(p.payment_intent_data, { metadata: { product: id } });
    assert.equal(p.subscription_data, undefined);
    assert.equal(p.success_url, `https://ciphercts.com/${id}?license=success&session_id={CHECKOUT_SESSION_ID}#license`);
    assert.equal(p.cancel_url, `https://ciphercts.com/${id}?license=cancelled#license`);
    assert.equal(p.custom_text, undefined, "no terms text until the product has terms");
    assert.equal(p.consent_collection, undefined);
    assert.ok(!JSON.stringify(p).includes("unit_amount") && !JSON.stringify(p).includes("price_data"));
  }
});

test("checkout: a recurring Stripe price makes a subscription session", async () => {
  const { handler, created } = checkout({ ...ENV, ...ON, STRIPE_PRICE_ID_CIPHER_STUDIO: "price_YEARLY12345" }, { recurring: true });
  const res = await ask(handler, { product: "cipher-studio" });
  assert.equal(res.statusCode, 200);
  assert.equal(created[0].mode, "subscription");
  assert.deepEqual(created[0].subscription_data, { metadata: { product: "cipher-studio" } });
  assert.equal(created[0].payment_intent_data, undefined);
});

test("checkout: terms checkbox flag never adds HLC's terms to other products", async () => {
  const { handler, created } = checkout({ ...ENV, ...ON, STRIPE_REQUIRE_TERMS_CHECKBOX: "true", STRIPE_PRICE_ID_CIPHER: "price_TEST123456" });
  await ask(handler, { product: "cipher" });
  assert.equal(created[0].consent_collection, undefined);
  assert.equal(created[0].custom_text, undefined);
});

test("checkout: Stripe failure for another product -> 502 without leaking secrets", async () => {
  const boom = createCheckoutHandler({ env: { ...ENV, ...ON, STRIPE_PRICE_ID_CIPHER: "price_TEST123456" }, getStripe: () => ({ prices: { retrieve: async () => { throw new Error("sk_test_dummy exploded"); } } }) });
  const res = await ask(boom, { product: "cipher" });
  assert.equal(res.statusCode, 502);
  assert.ok(!JSON.stringify(res.body).includes("sk_test"));
});

test("checkout: HLC is unchanged (no product in the body, or product hlc): $499/yr subscription, 1-50 assets, hlc-commercial", async () => {
  for (const body of [{}, { product: "hlc" }]) {
    const { handler, created, retrieved } = checkout({ ...ENV, HLC_PURCHASE_ENABLED: "true" });
    const res = await ask(handler, body);
    assert.equal(res.statusCode, 200);
    const p = created[0];
    assert.equal(p.mode, "subscription");
    assert.equal(p.line_items[0].price_data.unit_amount, 49900);
    assert.deepEqual(p.line_items[0].adjustable_quantity, { enabled: true, minimum: 1, maximum: 50 });
    assert.deepEqual(p.metadata, { product: "hlc-commercial" });
    assert.ok(p.success_url.startsWith("https://ciphercts.com/hlc?license=success"));
    assert.match(p.custom_text.submit.message, /commercial-terms/);
    assert.equal(retrieved.length, 0, "HLC never asks Stripe for a price id");
  }
  const { handler } = checkout({ ...ENV });
  const res = await ask(handler, {});
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.error, "Commercial licenses are not open for purchase yet. Nothing was charged. Questions: team@ciphercts.com.");
});

// ---------------------------------------------------------------- webhook + download
function eventFor(type, object, id = "evt_1") {
  return JSON.stringify({ id, object: "event", api_version: "2025-02-24.acacia", type, data: { object } });
}
const signedReq = (payload) => rawReq({ payload, headers: { "stripe-signature": Stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET }) } });
const paid = (product, over = {}) => ({ id: `cs_test_${product}`, object: "checkout.session", payment_status: "paid", metadata: { product }, customer_details: { email: "buyer@example.test" }, ...over });
function hook(env = ENV) {
  const store = memoryStore();
  const sent = [];
  const fetch = async (url, init) => (sent.push({ url, body: JSON.parse(init.body), headers: init.headers }), { ok: true, status: 200, json: async () => ({}) });
  return { handler: createWebhookHandler({ env, store, fetch, now: () => 1_800_000_000 }), store, sent };
}
const linkToken = (body) => decodeURIComponent(body.text.match(/api\/download\?token=([^\s]+)/)[1]);

test("webhook: each product's paid session emails THAT product's link with its own name and keys", async () => {
  for (const id of ["cipher", "cipher-bot", "cipher-studio"]) {
    const { handler, store, sent } = hook({ ...ENV, [purchaseOf(id).packageUrlVar]: `https://private.example.test/${id}.zip` });
    const res = new FakeRes();
    await handler(signedReq(eventFor("checkout.session.completed", paid(id))), res);
    assert.equal(res.statusCode, 200, id);
    assert.equal(sent.length, 1);
    const b = sent[0].body;
    const name = purchaseOf(id).name;
    assert.match(b.subject, new RegExp(name));
    assert.doesNotMatch(b.subject + b.text, /HLC/);
    assert.ok(b.text.includes(`purchasing ${name}`));
    assert.match(b.text, /ONE time/);
    assert.match(b.text, /Your receipt is sent separately by Stripe/);
    assert.doesNotMatch(b.text + b.html, /commercial-terms|subscription|\$\d/i, "no terms, subscription or price claims");
    assert.ok(b.text.includes("© 2026 Cipher CTS. All Rights Reserved.") && b.html.includes("© 2026 Cipher CTS. All Rights Reserved."));
    assert.ok(!JSON.stringify(b).includes("private.example.test"));
    assert.equal(sent[0].headers["Idempotency-Key"], `${id}-license-cs_test_${id}`);
    assert.equal(store.m.get(`${id}:email:cs_test_${id}`), "sent");
    const v = verifyToken(linkToken(b), DL, 1_800_000_000);
    assert.equal(v.ok, true);
    assert.equal(v.payload.prod, id);
    assert.equal(v.payload.exp, 1_800_000_000 + 72 * 3600);
  }
});

test("webhook: duplicate delivery for a product sends one email; a missing package variable fails loudly (500) and sends nothing", async () => {
  const { handler, sent } = hook();
  for (const i of [1, 2]) {
    const res = new FakeRes();
    await handler(signedReq(eventFor("checkout.session.completed", paid("cipher-bot"), `evt_${i}`)), res);
    assert.equal(res.statusCode, 200);
  }
  assert.equal(sent.length, 1);
  const none = hook({ ...ENV, PRODUCTION_PACKAGE_URL_CIPHER_STUDIO: undefined }); // HLC's package var is set, Studio's is not
  const res = new FakeRes();
  await none.handler(signedReq(eventFor("checkout.session.completed", paid("cipher-studio"))), res);
  assert.equal(res.statusCode, 500);
  assert.equal(none.sent.length, 0);
});

test("webhook: HLC is unchanged: hlc-commercial session -> HLC email, token without a product field, hlc: keys", async () => {
  const { handler, store, sent } = hook();
  const res = new FakeRes();
  await handler(signedReq(eventFor("checkout.session.completed", paid("hlc-commercial", { id: "cs_test_paid_1" }))), res);
  assert.equal(res.statusCode, 200);
  assert.match(sent[0].body.subject, /HLC Commercial Production License/);
  assert.ok(sent[0].body.text.includes("https://ciphercts.com/hlc/commercial-terms"));
  assert.equal(sent[0].headers["Idempotency-Key"], "hlc-license-cs_test_paid_1");
  assert.equal(store.m.get("hlc:email:cs_test_paid_1"), "sent");
  const v = verifyToken(linkToken(sent[0].body), DL, 1_800_000_000);
  assert.equal(v.payload.prod, undefined);
  assert.equal(v.payload.file, "production");
});

test("webhook: unknown / missing product markers and Concierge are ignored", async () => {
  const { handler, sent } = hook();
  for (const m of [{ product: "cipher-concierge" }, { product: "hlc" }, { product: "nope" }, {}]) {
    const res = new FakeRes();
    await handler(signedReq(eventFor("checkout.session.completed", paid("x", { id: `cs_${JSON.stringify(m)}`, metadata: m }))), res);
    assert.equal(res.statusCode, 200);
  }
  assert.equal(sent.length, 0);
});

function dl(env = ENV) {
  const store = memoryStore();
  return { store, handler: createDownloadHandler({ env, store, now: () => 1_800_000_000 - 3600 }) };
}
const tok = (extra = {}) => signToken({ sid: "cs_1", file: "production", exp: 1_800_000_000 + 72 * 3600, jti: "jti-x", ...extra }, DL);
const post = (token) => jsonReq({ method: "POST", body: { token } });
const get = (token) => jsonReq({ method: "GET", query: { token } });

test("download: each product's link delivers only its own package, one time, with its own key prefix", async () => {
  const map = { cipher: ENV.PRODUCTION_PACKAGE_URL_CIPHER, "cipher-bot": ENV.PRODUCTION_PACKAGE_URL_CIPHER_BOT };
  for (const [id, url] of Object.entries(map)) {
    const { handler, store } = dl();
    const t = tok({ prod: id, jti: `j-${id}` });
    let res = new FakeRes();
    await handler(get(t), res);
    assert.equal(res.statusCode, 200);
    assert.match(res.body, new RegExp(`Your ${purchaseOf(id).name} package`));
    assert.doesNotMatch(res.body, /HLC/);
    res = new FakeRes();
    await handler(post(t), res);
    assert.equal(res.statusCode, 302);
    assert.equal(res.redirectTo, url);
    assert.notEqual(res.redirectTo, ENV.PRODUCTION_PACKAGE_URL);
    assert.ok(store.m.has(`${id}:dl:j-${id}`));
    res = new FakeRes();
    await handler(post(t), res);
    assert.equal(res.statusCode, 410);
    assert.equal(res.redirectTo, null);
  }
});

test("download: a product with no package variable never falls back to HLC's package (503, link not used up)", async () => {
  const { handler, store } = dl();
  const t = tok({ prod: "cipher-studio", jti: "j-studio" });
  for (const req of [get(t), post(t)]) {
    const res = new FakeRes();
    await handler(req, res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.redirectTo, null);
  }
  assert.equal(store.m.size, 0);
});

test("download: unknown or Concierge product in a (validly signed) token -> 400; forged product field -> 400", async () => {
  const { handler } = dl();
  for (const prod of ["cipher-concierge", "nope", 5, null, ""]) {
    const res = new FakeRes();
    await handler(post(tok({ prod })), res);
    assert.equal(res.statusCode, 400, String(prod));
    assert.equal(res.redirectTo, null);
  }
  const good = tok({ prod: "cipher-bot" });
  const [body, sig] = good.split(".");
  const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url")), prod: "cipher" })).toString("base64url");
  const res = new FakeRes();
  await handler(post(`${forged}.${sig}`), res);
  assert.equal(res.statusCode, 400);
});

test("download: HLC tokens (no product field) still deliver HLC's package, and a missing HLC package still fails closed", async () => {
  const { handler } = dl();
  const res = new FakeRes();
  await handler(post(tok({ jti: "j-hlc" })), res);
  assert.equal(res.statusCode, 302);
  assert.equal(res.redirectTo, ENV.PRODUCTION_PACKAGE_URL);
  assert.match((await (async () => { const r = new FakeRes(); await handler(get(tok({ jti: "j-hlc2" })), r); return r.body; })()), /Your HLC production package/);
  const none = dl({ ...ENV, PRODUCTION_PACKAGE_URL: undefined });
  const r2 = new FakeRes();
  await none.handler(post(tok({ jti: "j-hlc3" })), r2);
  assert.equal(r2.statusCode, 503);
});

test("email: HLC email is the same as before; other products get no HLC wording", () => {
  const hlc = buildEmail({ link: "https://ciphercts.com/api/download?token=t", expiresAt: 1_800_000_000 });
  assert.equal(hlc.subject, "Your HLC Commercial Production License: secure download link");
  assert.equal(JSON.stringify(buildEmail({ link: "https://ciphercts.com/api/download?token=t", expiresAt: 1_800_000_000, product: "hlc" })), JSON.stringify(hlc));
  const other = buildEmail({ link: "https://ciphercts.com/api/download?token=t", expiresAt: 1_800_000_000, product: "cipher-bot" });
  assert.equal(other.subject, "Your Cipher Bot purchase: secure download link");
  assert.doesNotMatch(other.text + other.html, /HLC|engine|commercial/i);
});

// ---------------------------------------------------------------- pages
test("pages: each sellable product page mounts the purchase card; Concierge and the free HLC page are not touched", () => {
  for (const id of IDS) {
    const src = read(`pages/${id}.js`);
    assert.match(src, new RegExp(`purchase=\\{<ProductPurchase id="${id}" />\\}`), id);
  }
  assert.doesNotMatch(read("pages/cipher-concierge.js"), /ProductPurchase/);
  assert.doesNotMatch(read("pages/hlc.js"), /ProductPurchase/);
});

test("card: literal NEXT_PUBLIC names for every product (so Next inlines them), default OFF, 'Opens soon', no price text of its own", () => {
  const src = read("components/ProductPurchase.js");
  const code = strip(src);
  for (const id of IDS) {
    const c = purchaseOf(id);
    assert.ok(code.includes(`process.env.${c.publicFlag}`), c.publicFlag);
    assert.ok(code.includes(`process.env.${c.priceLabelVar}`), c.priceLabelVar);
  }
  assert.match(code, /\.enabled === "true"/);
  assert.match(code, /!enabled && \(\s*<p className=\{p\.closed\} data-testid="purchase-closed">\s*Opens soon\./);
  assert.match(code, /\{enabled && \(\s*<button/);
  assert.match(code, /if \(!enabled \|\| !ONLINE/);
  assert.match(code, /label = enabled &&/); // price text only when on AND configured
  assert.doesNotMatch(code, /\$\s?\d|session_id|CHECKOUT_SESSION_ID|\/api\/download/);
  assert.match(code, /role="status"/);
  assert.match(code, /aria-live="polite"/);
  assert.match(code, /licenseBannerFromSearch\(window\.location\.search\)/);
  assert.match(code, /id="license"/);
  assert.match(code, /JSON\.stringify\(\{ product: id \}\)/);
});

test("card: styles are large (>= 18px) and high contrast", () => {
  const css = read("styles/Product.module.css");
  const rule = (name) => css.match(new RegExp(`\\.${name}\\s*\\{[^}]*\\}`))?.[0] || "";
  for (const n of ["closed", "retTitle"]) assert.match(rule(n), /font-size:\s*(2\d|3\d|clamp\(2\d)/, n);
  assert.match(rule("closed"), /background:\s*#000/);
  assert.match(rule("ret"), /font-size:\s*20px/);
});

test("return URLs for every product show the same banner messages", () => {
  for (const id of IDS) {
    assert.equal(licenseBannerFromSearch(new URL(`https://ciphercts.com/${id}?license=success&session_id={CHECKOUT_SESSION_ID}#license`).search), "success");
    assert.equal(licenseBannerFromSearch(new URL(`https://ciphercts.com/${id}?license=cancelled#license`).search), "cancelled");
  }
});

// ---------------------------------------------------------------- docs
test("docs and .env.example list every per-product variable name, and never a value", () => {
  const doc = read("docs/STRIPE_SETUP.md");
  const env = read(".env.example");
  for (const id of ["hlc", ...IDS]) {
    const c = purchaseOf(id);
    for (const n of [c.flag, c.publicFlag, c.packageUrlVar, c.priceIdVar, c.priceLabelVar].filter(Boolean)) {
      assert.ok(doc.includes(`\`${n}\``), `doc: ${n}`);
      assert.ok(new RegExp(`^#?\\s*${n}=$`, "m").test(env) || id === "hlc", `.env.example: ${n}`);
    }
  }
  assert.doesNotMatch(env, /price_[A-Za-z0-9]{6,}|sk_(live|test)_[A-Za-z0-9]+|whsec_[A-Za-z0-9]+/);
});
