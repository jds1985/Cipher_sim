// cipher_os/runtime/telemetryState.js
// In-memory telemetry store (Vercel serverless best-effort).
// Note: state resets on cold starts. Later we can persist to Firestore.

const MAX_RUNS = 40;

let telemetry = {
  updatedAt: null,
  lastRun: null,
  runs: [],
  scores: {}, // { provider: { score, success, fail, avgLatency } }
};

export function setScores(scoreSnapshot = {}) {
  telemetry.scores = scoreSnapshot || {};
  telemetry.updatedAt = Date.now();
}

export function recordRun(run) {
  telemetry.lastRun = run;
  telemetry.updatedAt = Date.now();

  telemetry.runs.unshift(run);
  if (telemetry.runs.length > MAX_RUNS) telemetry.runs.pop();
}

export function getTelemetry() {
  return telemetry;
}

export function clearTelemetry() {
  telemetry = {
    updatedAt: null,
    lastRun: null,
    runs: [],
    scores: {},
  };
}
