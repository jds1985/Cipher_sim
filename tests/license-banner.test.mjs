// © 2026 Cipher CTS. All Rights Reserved.
// Proprietary and confidential. Not covered by the free evaluation license.
// Buyer-facing success / cancelled messages on /hlc. No network, no Stripe, no secrets.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LICENSE_BANNER_COPY, SUPPORT_EMAIL, licenseBannerFromSearch } from "../lib/hlc/license/banner.js";
import { DOWNLOAD_TTL_SECONDS } from "../lib/hlc/license/config.js";
import { createCheckoutHandler } from "../lib/hlc/license/checkout.js";
import { FakeRes, jsonReq } from "./helpers.mjs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const all = (k) => [LICENSE_BANNER_COPY[k].title, ...LICENSE_BANNER_COPY[k].lines].join(" ");

test("banner: only license=success and license=cancelled are recognised", () => {
  assert.equal(licenseBannerFromSearch("?license=success&session_id=cs_test_abc"), "success");
  assert.equal(licenseBannerFromSearch("?license=cancelled"), "cancelled");
  for (const bad of ["", "?", "?license=", "?license=SUCCESS", "?license=paid", "?license=success%20", "?session_id=cs_test_abc", undefined, null, 42]) {
    assert.equal(licenseBannerFromSearch(bad), null, String(bad));
  }
});

test("banner: success text says what the buyer needs and nothing it cannot know", () => {
  const t = all("success");
  assert.equal(LICENSE_BANNER_COPY.success.title, "Payment received. Thank you.");
  assert.match(t, /emailed to the address you used at checkout/);
  assert.match(t, /one time/);
  assert.match(t, new RegExp(`expires after ${DOWNLOAD_TTL_SECONDS / 3600} hours`));
  assert.match(t, /72 hours/);
  assert.match(t, /spam/i);
  assert.match(t, /within 15 minutes/);
  assert.ok(t.includes(SUPPORT_EMAIL));
  assert.doesNotMatch(t, /verified|confirmed|download now|click here to download/i);
});

test("banner: the support address is the one used everywhere else on the site", () => {
  assert.equal(SUPPORT_EMAIL, "team@ciphercts.com");
  assert.match(read("content/hlc/HLC_COMMERCIAL_TERMS.txt"), /Support is best effort by email at team@ciphercts\.com/);
  assert.match(read("components/hlc/ContactCard.js"), /team@ciphercts\.com/);
});

test("banner: cancelled text is calm and says nothing was charged", () => {
  assert.equal(LICENSE_BANNER_COPY.cancelled.title, "Checkout cancelled. You were not charged.");
  assert.doesNotMatch(all("cancelled"), /error|fail|problem/i);
});

test("banner: sentences are short", () => {
  for (const k of ["success", "cancelled"]) {
    for (const line of [LICENSE_BANNER_COPY[k].title, ...LICENSE_BANNER_COPY[k].lines]) {
      assert.ok(line.split(/\s+/).length <= 20, line);
    }
  }
});

test("License component: live region, no session_id use, no direct download, card stays", () => {
  const src = read("components/hlc/License.js");
  const code = src.replace(/\/\/.*$/gm, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, ""); // comments may mention session_id; code must not use it
  assert.match(src, /role="status"/);
  assert.match(src, /aria-live="polite"/);
  assert.match(src, /licenseBannerFromSearch\(window\.location\.search\)/);
  assert.doesNotMatch(code, /session_id|CHECKOUT_SESSION_ID|\/api\/download|\/api\/session/);
  assert.match(src, /data-testid="purchase-btn"/); // purchase card is not hidden for either banner
  assert.doesNotMatch(src, /banner\s*(===|!==)\s*"cancelled"\s*&&[\s\S]{0,40}purchase-btn/);
  const mod = read("lib/hlc/license/banner.js");
  assert.doesNotMatch(mod.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, ""), /session_id|fetch\(/);
});

test("banner: stays in step with the Stripe return URLs", async () => {
  const handler = createCheckoutHandler({
    env: { HLC_PURCHASE_ENABLED: "true", STRIPE_SECRET_KEY: "sk_test_dummy", NEXT_PUBLIC_SITE_URL: "https://ciphercts.com" },
    getStripe: () => ({ checkout: { sessions: { create: async (p) => ((globalThis.__p = p), { id: "cs_test_1", url: "https://checkout.stripe.com/x" }) } } }),
  });
  await handler(jsonReq({ body: {}, headers: { origin: "https://ciphercts.com" } }), new FakeRes());
  const p = globalThis.__p;
  delete globalThis.__p;
  const u = new URL(p.success_url);
  assert.equal(licenseBannerFromSearch(u.search), "success");
  assert.equal(u.hash, "#license");
  const c = new URL(p.cancel_url);
  assert.equal(licenseBannerFromSearch(c.search), "cancelled");
  assert.equal(c.hash, "#license");
});
