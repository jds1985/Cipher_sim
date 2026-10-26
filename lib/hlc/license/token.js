// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
// Signed, expiring download tokens: base64url(JSON payload) + "." + base64url(HMAC-SHA256).
import { createHmac, timingSafeEqual } from "node:crypto";

const b64u = (buf) => Buffer.from(buf).toString("base64url");

function mac(body, secret) {
  return createHmac("sha256", secret).update(body).digest();
}

/** payload: { sid: Stripe session id, file: file key, exp: unix seconds, jti: random id } */
export function signToken(payload, secret) {
  if (!secret) throw new Error("DOWNLOAD_LINK_SECRET is not set");
  const body = b64u(JSON.stringify(payload));
  return `${body}.${b64u(mac(body, secret))}`;
}

/** Returns { ok:true, payload } or { ok:false, reason: "malformed" | "bad-signature" | "expired" }. */
export function verifyToken(token, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!secret) return { ok: false, reason: "no-secret" };
  if (typeof token !== "string" || token.length > 2000) return { ok: false, reason: "malformed" };
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { ok: false, reason: "malformed" };
  const given = Buffer.from(parts[1], "base64url");
  const want = mac(parts[0], secret);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return { ok: false, reason: "bad-signature" };
  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (!payload || typeof payload.sid !== "string" || typeof payload.jti !== "string" || typeof payload.file !== "string" || !Number.isFinite(payload.exp)) {
    return { ok: false, reason: "malformed" };
  }
  if (payload.exp <= nowSeconds) return { ok: false, reason: "expired", payload };
  return { ok: true, payload };
}
