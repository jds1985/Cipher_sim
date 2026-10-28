// © 2026 Cipher CTS. All Rights Reserved.
// Proprietary and confidential. Not covered by the free evaluation license.
// The master purchase switch: default closed, server and page. No network, no Stripe, no secrets.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isPurchaseEnabled } from "../lib/hlc/license/config.js";
import { createCheckoutHandler } from "../lib/hlc/license/checkout.js";
import { FakeRes, jsonReq } from "./helpers.mjs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

function handlerWith(env) {
  const calls = [];
  const handler = createCheckoutHandler({
    env,
    getStripe: () => ({ checkout: { sessions: { create: async (p) => (calls.push(p), { id: "cs_test_1", url: "https://checkout.stripe.com/c/pay/cs_test_1" }) } } }),
  });
  return { handler, calls };
}

test("flag: only the exact word true switches selling on (any case, trimmed)", () => {
  assert.equal(isPurchaseEnabled({}), false);
  assert.equal(isPurchaseEnabled(undefined), false);
  for (const bad of ["", "false", "1", "yes", "on", "truee", "NEXT"]) assert.equal(isPurchaseEnabled({ HLC_PURCHASE_ENABLED: bad }), false, bad);
  // the public flag alone must never open the API
  assert.equal(isPurchaseEnabled({ NEXT_PUBLIC_HLC_PURCHASE_ENABLED: "true" }), false);
  for (const ok of ["true", "TRUE", " true "]) assert.equal(isPurchaseEnabled({ HLC_PURCHASE_ENABLED: ok }), true, ok);
});

test("checkout: closed by default -> 503, clear message, Stripe is never called", async () => {
  for (const env of [{ STRIPE_SECRET_KEY: "sk_test_dummy" }, { STRIPE_SECRET_KEY: "sk_test_dummy", HLC_PURCHASE_ENABLED: "false" }, { STRIPE_SECRET_KEY: "sk_test_dummy", NEXT_PUBLIC_HLC_PURCHASE_ENABLED: "true" }, {}]) {
    const { handler, calls } = handlerWith(env);
    const res = new FakeRes();
    await handler(jsonReq({ body: {}, headers: { origin: "https://ciphercts.com" } }), res);
    assert.equal(res.statusCode, 503);
    assert.match(res.body.error, /not open for purchase yet/i);
    assert.match(res.body.error, /Nothing was charged/);
    assert.match(res.body.error, /team@ciphercts\.com/);
    assert.equal(res.body.url, undefined);
    assert.equal(calls.length, 0);
  }
});

test("checkout: with the flag on it works as before", async () => {
  const { handler, calls } = handlerWith({ STRIPE_SECRET_KEY: "sk_test_dummy", HLC_PURCHASE_ENABLED: "true" });
  const res = new FakeRes();
  await handler(jsonReq({ body: {}, headers: { origin: "https://ciphercts.com" } }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(calls.length, 1);
});

test("checkout: wrong method is still 405 and the closed switch does not leak details", async () => {
  const { handler } = handlerWith({});
  const res = new FakeRes();
  await handler({ method: "GET", headers: {} }, res);
  assert.equal(res.statusCode, 405);
});

test("License card: Purchase button only exists behind NEXT_PUBLIC_HLC_PURCHASE_ENABLED; closed note and the rest of the card stay", () => {
  const src = read("components/hlc/License.js");
  assert.match(src, /process\.env\.NEXT_PUBLIC_HLC_PURCHASE_ENABLED === "true"/);
  assert.match(src, /\{ENABLED && \(\s*<button/);
  assert.match(src, /!ENABLED && \(\s*<p className="hx-closed" data-testid="purchase-closed"/);
  assert.match(src, /Commercial licenses open soon\. Questions:/);
  assert.match(src, /if \(!ENABLED \|\| !ONLINE/); // the click handler is also guarded
  // unchanged parts of the card
  for (const keep of ['data-testid="license-price"', "$499", "commercial-terms-link", "licenseBannerFromSearch", 'role="status"', "More than 50 assets|more than 50 assets"]) {
    assert.match(src, new RegExp(keep.replace(/[$]/g, "\\$")), keep);
  }
  const css = read("styles/Hlc.module.css");
  assert.match(css, /hx-closed\) \{[^}]*font-size: 24px[^}]*background: #000/);
});
