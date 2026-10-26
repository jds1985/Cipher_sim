// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
// Tiny key-value store over the Upstash / Vercel KV REST API (plain fetch, no SDK).
// Used for two things only: "one email per Stripe session" and "one use per download link".
// If KV_REST_API_URL / KV_REST_API_TOKEN are missing, createStore returns null and callers FAIL CLOSED.

export function createStore(env = process.env, fetchImpl = globalThis.fetch) {
  const url = env.KV_REST_API_URL;
  const token = env.KV_REST_API_TOKEN;
  if (!url || !token) return null;

  async function cmd(args) {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    if (!res.ok) throw new Error(`KV store error ${res.status}`);
    const data = await res.json();
    if (data && data.error) throw new Error(`KV store error: ${data.error}`);
    return data.result;
  }

  return {
    /** Atomically set only if the key does not exist. Returns true if THIS call created it. */
    async setNX(key, value, ttlSeconds) {
      return (await cmd(["SET", key, value, "NX", "EX", String(ttlSeconds)])) === "OK";
    },
    async get(key) {
      return await cmd(["GET", key]);
    },
    async set(key, value, ttlSeconds) {
      await cmd(["SET", key, value, "EX", String(ttlSeconds)]);
    },
    async del(key) {
      await cmd(["DEL", key]);
    },
  };
}
