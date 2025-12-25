// pages/api/siva-plan.js
// SIVA — PLAN PHASE (TEMP STUB)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { command } = req.body;

  if (!command || typeof command !== "string") {
    return res.status(400).json({ error: "Missing SIVA command" });
  }

  // TEMP: simple intent detection
  const plan = {
    taskId: "UI_SETTINGS_AUTONOMY",
    summary: "Build settings page with Autonomy toggle",
    files: [
      {
        path: "pages/settings.js",
        description: "Settings page UI with Autonomy toggle",
      },
      {
        path: "components/AutonomyToggle.js",
        description: "Reusable Autonomy toggle component",
      },
    ],
    apply: false,
  };

  return res.status(200).json({
    status: "SIVA_PLAN_READY",
    plan,
  });
}
