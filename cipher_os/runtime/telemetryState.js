// cipher_os/runtime/telemetryState.js
// In-memory telemetry store (Vercel serverless best-effort).
// Note: state resets on cold starts. Later we can persist to Firestore.

const MAX_RUNS = 40;

let telemetry = {
  updatedAt: null,
  lastRun: null,
  runs: [],
  scores: {}, // { provider: { score, success, fail, avgLatency, quality } }

  // ─────────────────────────────────────────────
  // SIVA EVOLUTION STATE (Tiered + Supervised)
  // ─────────────────────────────────────────────
  evolution: {
    tier: 0, // 0=locked, 1=apprentice, 2=journeyman, 3=builder
    activeExperiment: null, // { id, label, startedAt, baseline, minRuns }
    lastDecision: null, // { at, decision, delta }
    history: [], // small in-memory history (best-effort)
  },
};

function computeMetricsFromRuns(runs = []) {
  const slice = runs.filter(Boolean);

  const n = slice.length;
  if (!n) {
    return {
      n: 0,
      avgQuality: null,
      successRate: null,
      avgLatencyMs: null,
      errorRate: null,
    };
  }

  let qualitySum = 0;
  let qualityCount = 0;
  let ok = 0;
  let latencySum = 0;
  let latencyCount = 0;
  let errors = 0;

  for (const r of slice) {
    if (r?.success) ok++;
    else errors++;

    if (typeof r?.quality === "number") {
      qualitySum += r.quality;
      qualityCount++;
    }

    if (typeof r?.latencyMs === "number") {
      latencySum += r.latencyMs;
      latencyCount++;
    }
  }

  return {
    n,
    avgQuality: qualityCount ? Number((qualitySum / qualityCount).toFixed(4)) : null,
    successRate: Number((ok / n).toFixed(4)),
    avgLatencyMs: latencyCount ? Math.round(latencySum / latencyCount) : null,
    errorRate: Number((errors / n).toFixed(4)),
  };
}

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
    evolution: {
      tier: 0,
      activeExperiment: null,
      lastDecision: null,
      history: [],
    },
  };
}

/* ─────────────────────────────────────────────
   SIVA EVOLUTION HELPERS
───────────────────────────────────────────── */

export function getEvolutionState() {
  return telemetry.evolution;
}

export function startEvolutionExperiment({
  id,
  label,
  minRuns = 12,
} = {}) {
  const baseline = computeMetricsFromRuns(telemetry.runs.slice(0, minRuns));

  telemetry.evolution.activeExperiment = {
    id: id || `EXP_${Date.now()}`,
    label: label || "Unnamed experiment",
    startedAt: Date.now(),
    baseline,
    minRuns,
  };

  telemetry.evolution.lastDecision = null;
  telemetry.updatedAt = Date.now();

  return telemetry.evolution.activeExperiment;
}

export function evaluateEvolutionExperiment({
  minRunsOverride,
  promoteThreshold = 0.03, // +3% avg quality
  maxLatencyIncreaseMs = 250, // don’t get slower too much
} = {}) {
  const exp = telemetry.evolution.activeExperiment;
  if (!exp) {
    return { ok: false, reason: "No active experiment" };
  }

  const minRuns = Number(minRunsOverride || exp.minRuns || 12);
  const current = computeMetricsFromRuns(telemetry.runs.slice(0, minRuns));

  if ((current?.n || 0) < minRuns) {
    return { ok: false, reason: `Not enough runs yet (${current.n}/${minRuns})` };
  }

  const b = exp.baseline || {};
  const deltaQuality =
    b.avgQuality === null || current.avgQuality === null
      ? null
      : Number((current.avgQuality - b.avgQuality).toFixed(4));

  const deltaLatency =
    b.avgLatencyMs === null || current.avgLatencyMs === null
      ? null
      : current.avgLatencyMs - b.avgLatencyMs;

  // Decision logic (simple + conservative)
  let decision = "HOLD";
  if (deltaQuality !== null) {
    const qualityImproved = deltaQuality >= promoteThreshold;
    const latencyOk = deltaLatency === null ? true : deltaLatency <= maxLatencyIncreaseMs;

    if (qualityImproved && latencyOk && current.errorRate <= (b.errorRate ?? 1)) {
      decision = "PROMOTE";
    } else if (deltaQuality < 0 && current.errorRate > (b.errorRate ?? 0)) {
      decision = "REGRESS";
    }
  }

  const out = {
    ok: true,
    decision,
    baseline: b,
    current,
    delta: {
      quality: deltaQuality,
      latencyMs: deltaLatency,
      errorRate: b.errorRate === null || current.errorRate === null
        ? null
        : Number((current.errorRate - b.errorRate).toFixed(4)),
    },
  };

  telemetry.evolution.lastDecision = { at: Date.now(), ...out };

  // If promote, bump tier (max 3)
  if (decision === "PROMOTE") {
    telemetry.evolution.tier = Math.min(3, (telemetry.evolution.tier || 0) + 1);
    telemetry.evolution.history.unshift({
      at: Date.now(),
      id: exp.id,
      label: exp.label,
      decision,
      delta: out.delta,
      newTier: telemetry.evolution.tier,
    });
    if (telemetry.evolution.history.length > 20) telemetry.evolution.history.pop();
  }

  // End experiment on PROMOTE or REGRESS
  if (decision === "PROMOTE" || decision === "REGRESS") {
    telemetry.evolution.activeExperiment = null;
  }

  telemetry.updatedAt = Date.now();
  return out;
}
