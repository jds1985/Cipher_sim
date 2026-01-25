// cipher_os/runtime/telemetry.js
// Minimal tracing for Cipher OS V0 (server-side)

export function createTrace(requestId) {
  const start = Date.now();
  const events = [];

  function log(type, data = {}) {
    events.push({
      t: Date.now(),
      type,
      ...data,
    });
  }

  function finish(extra = {}) {
    return {
      requestId,
      startedAt: start,
      endedAt: Date.now(),
      durationMs: Date.now() - start,
      events,
      ...extra,
    };
  }

  return { log, finish };
}
