// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
// Allow-list for the redirect URLs Stripe sends the buyer back to. Anything else is ignored.
import { DEFAULT_SITE_ORIGIN } from "./config.js";

const FIXED = ["https://ciphercts.com", "https://www.ciphercts.com", "http://localhost:3000", "http://127.0.0.1:3000"];
// Vercel preview deployments of this project (system env vars VERCEL_URL / VERCEL_BRANCH_URL are added too).
const PREVIEW_RE = /^https:\/\/cipher-sim(-[a-z0-9-]+)?-james-saenz-s-projects\.vercel\.app$/;

function originOf(value) {
  try {
    const u = new URL(value);
    if (u.username || u.password) return null;
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.origin;
  } catch {
    return null;
  }
}

export function isAllowedOrigin(origin, env = process.env) {
  if (!origin) return false;
  if (FIXED.includes(origin)) return true;
  if (PREVIEW_RE.test(origin)) return true;
  for (const h of [env.VERCEL_URL, env.VERCEL_BRANCH_URL]) if (h && origin === `https://${h}`) return true;
  const site = env.NEXT_PUBLIC_SITE_URL ? originOf(env.NEXT_PUBLIC_SITE_URL) : null;
  return Boolean(site && origin === site);
}

/** The site origin to build default success/cancel URLs from (never an attacker-chosen host). */
export function pickSiteOrigin(req, env = process.env) {
  const h = req?.headers || {};
  const proto = String(h["x-forwarded-proto"] || "").split(",")[0].trim() || "http";
  const candidates = [h.origin ? originOf(String(h.origin)) : null, h.host ? originOf(`${proto}://${h.host}`) : null];
  for (const c of candidates) if (c && isAllowedOrigin(c, env)) return c;
  return (env.NEXT_PUBLIC_SITE_URL && originOf(env.NEXT_PUBLIC_SITE_URL)) || DEFAULT_SITE_ORIGIN;
}

/** A caller-supplied URL is accepted only if its origin is on the allow-list; otherwise null. */
export function validateRedirect(value, env = process.env) {
  if (typeof value !== "string" || value.length === 0 || value.length > 2000) return null;
  const o = originOf(value);
  if (!o || !isAllowedOrigin(o, env)) return null;
  return value;
}
