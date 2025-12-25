// pages/api/siva-plan.js
// SIVA — PLAN PHASE (READ-ONLY, NO COMMITS)

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      status: "METHOD_NOT_ALLOWED",
    });
  }

  const { command } = req.body || {};

  if (!command || typeof command !== "string") {
    return res.status(400).json({
      status: "INVALID_COMMAND",
      error: "Missing or invalid `command` string",
    });
  }

  // 🔍 Minimal deterministic planner (no AI yet)
  const plan = {
    taskId: "SIVA_PLAN_" + Date.now(),
    intent: command,
    summary: "Build a basic Settings UI with an Autonomy toggle",
    files: [
      {
        path: "pages/settings.js",
        action: "CREATE_OR_UPDATE",
        description: "Settings page UI with Autonomy toggle",
      },
      {
        path: "components/AutonomyToggle.js",
        action: "CREATE",
        description: "Reusable autonomy on/off switch",
      },
    ],
    safeguards: {
      applyChanges: false,
      requiresApproval: true,
    },
    nextStep: "Await human approval before apply phase",
  };

  return res.status(200).json({
    status: "SIVA_PLAN_OK",
    time: new Date().toISOString(),
    plan,
  });
}
