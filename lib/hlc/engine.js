// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Cipher CTS
/**
 * Browser-side client for the HLC engine that runs on the visitor's OWN computer (http://127.0.0.1:8000).
 * It must be called from the browser: a server (including Vercel) can never reach a visitor's 127.0.0.1,
 * so there is intentionally NO server-side proxy.
 */
export const ENGINE_URL = "http://127.0.0.1:8000";

export class EngineError extends Error {
  constructor(kind, message, httpStatus) {
    super(message);
    this.kind = kind; // "unreachable" | "timeout" | "http" | "bad-response"
    this.httpStatus = httpStatus;
  }
}

/**
 * Chrome 142+ gates https-page -> http://127.0.0.1 requests behind a "Local Network Access" permission prompt
 * and wants fetch() to declare the target address space. Browsers that do not know the option ignore it.
 */
function lnaInit() {
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return { targetAddressSpace: "loopback" };
  }
  return {};
}

async function request(path, init, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(`${ENGINE_URL}${path}`, { ...init, ...lnaInit(), signal: ctrl.signal, cache: "no-store", mode: "cors" });
  } catch (e) {
    if (e && e.name === "AbortError") {
      throw new EngineError("timeout", `The engine did not answer within ${Math.round(timeoutMs / 1000)} seconds.`);
    }
    // fetch() hides the real reason (engine stopped, CORS blocked, permission denied, mixed content).
    throw new EngineError(
      "unreachable",
      "The browser could not reach the engine (it is not running, or the browser/CORS blocked the connection).",
    );
  } finally {
    clearTimeout(timer);
  }
}

const isString = (v) => typeof v === "string";

export async function fetchHealth(timeoutMs = 3000) {
  const res = await request("/health", { method: "GET" }, timeoutMs);
  if (!res.ok) throw new EngineError("http", `Engine answered HTTP ${res.status} on /health.`, res.status);
  let o;
  try {
    o = await res.json();
  } catch {
    throw new EngineError("bad-response", "Engine /health did not return JSON.");
  }
  if (!o || !isString(o.status)) throw new EngineError("bad-response", 'Engine /health JSON has no "status".');
  return {
    status: o.status,
    engine: isString(o.engine) ? o.engine : "(not reported)",
    architecture: isString(o.architecture) ? o.architecture : "(not reported)",
    device: isString(o.device) ? o.device : "(not reported)",
    // present on the v2 engine ("nasa_v2"); absent on v1 / v1.1. Used to pick the matching preset scaling.
    ...(isString(o.weights) ? { weights: o.weights } : {}),
  };
}

/** Returns { data, latencyMs } where latencyMs is the browser-measured round trip (includes any CORS preflight). */
export async function predict(sensorStream, timeoutMs = 20000) {
  const t0 = performance.now();
  const res = await request(
    "/predict",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sensor_stream: sensorStream }) },
    timeoutMs,
  );
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.text()).slice(0, 300);
    } catch {
      /* ignore */
    }
    throw new EngineError("http", `Engine answered HTTP ${res.status} on /predict. ${detail}`.trim(), res.status);
  }
  let o;
  try {
    o = await res.json();
  } catch {
    throw new EngineError("bad-response", "Engine /predict did not return JSON.");
  }
  const latencyMs = performance.now() - t0;
  if (
    !o ||
    typeof o.predicted_remaining_life_cycles !== "number" ||
    typeof o.ojas_vitality_index !== "number" ||
    typeof o.status !== "string"
  ) {
    throw new EngineError("bad-response", "Engine /predict JSON is missing one of the 3 expected fields.");
  }
  return { data: o, latencyMs };
}
