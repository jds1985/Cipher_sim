// pages/api/siva-supervise.js
// SIVA — SUPERVISOR GATE (Tiered Evolution Controller) — Admin Only

import {
  getTelemetry,
  getEvolutionState,
  startEvolutionExperiment,
  evaluateEvolutionExperiment,
} from "../../cipher_os/runtime/telemetryState.js";

const { SIVA_ADMIN_KEY } = process.env;

function json(res, status, payload) {
  return res.status(status).json(payload);
}

function checkAdmin(req) {
  if (!SIVA_ADMIN_KEY) return true;
  return req.headers["x-siva-admin"] === SIVA_ADMIN_KEY;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { status: "METHOD_NOT_ALLOWED" });
  }

  if (!checkAdmin(req)) {
    return json(res, 401, { status: "SIVA_UNAUTHORIZED" });
  }

  const { action, label, minRuns } = req.body || {};

  const act = String(action || "").toUpperCase();

  if (act === "STATUS") {
    const tel = getTelemetry();
    return json(res, 200, {
      status: "SIVA_SUPERVISOR_OK",
      evolution: getEvolutionState(),
      telemetry: {
        updatedAt: tel.updatedAt,
        runs: tel.runs?.length || 0,
        lastRun: tel.lastRun || null,
        scores: tel.scores || {},
      },
    });
  }

  if (act === "START") {
    const exp = startEvolutionExperiment({
      label: label || "Evolution experiment",
      minRuns: Number(minRuns || 12),
    });

    return json(res, 200, {
      status: "SIVA_EXPERIMENT_STARTED",
      experiment: exp,
      evolution: getEvolutionState(),
      note: "Apply ONE small patch now, then generate ~12+ real runs, then call EVALUATE.",
    });
  }

  if (act === "EVALUATE") {
    const result = evaluateEvolutionExperiment({});
    return json(res, 200, {
      status: "SIVA_EXPERIMENT_EVALUATED",
      result,
      evolution: getEvolutionState(),
      note:
        result?.decision === "PROMOTE"
          ? "PROMOTED: Tier increased. Next evolution can be slightly larger."
          : result?.decision === "REGRESS"
          ? "REGRESSED: Recommend reverting last patch (manual for now)."
          : "HOLD: Keep collecting runs and evaluate again.",
    });
  }

  return json(res, 400, {
    status: "BAD_REQUEST",
    error: 'Unknown action. Use: "STATUS" | "START" | "EVALUATE"',
  });
}
