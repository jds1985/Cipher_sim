// pages/api/siva-plan.js
// SIVA — PLAN PHASE (READ-ONLY, NO COMMITS, HUMAN APPROVAL REQUIRED)

import crypto from "crypto";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      status: "METHOD_NOT_ALLOWED",
    });
  }

  // Accept either `instruction` (terminal) or `command` (legacy/tests)
  const { instruction, command, source = "unknown" } = req.body || {};
  const input = instruction || command;

  if (!input || typeof input !== "string") {
    return res.status(400).json({
      status: "INVALID_COMMAND",
      error: "Missing or invalid instruction/command string",
    });
  }

  const taskId = "SIVA_PLAN_" + Date.now();

  // --- FILE INTENT (DETERMINISTIC, SAFE) ---
  const files = [
    {
      path: "pages/settings.js",
      action: "CREATE_OR_UPDATE",
      description: "Settings page UI with Autonomy toggle",
      content: `
export default function Settings() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Settings</h1>
      <label style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input type="checkbox" />
        Autonomy Enabled
      </label>
    </div>
  );
}
      `.trim(),
    },
    {
      path: "components/AutonomyToggle.js",
      action: "CREATE",
      description: "Reusable autonomy on/off switch",
      content: `
export default function AutonomyToggle({ value = false, onChange }) {
  return (
    <label style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      Autonomy
    </label>
  );
}
      `.trim(),
    },
  ];

  // --- INTEGRITY CHECKSUM (ANTI-TAMPER / AUDIT) ---
  const checksum = crypto
    .createHash("sha256")
    .update(JSON.stringify(files))
    .digest("hex");

  return res.status(200).json({
    status: "SIVA_PLAN_OK",
    time: new Date().toISOString(),

    // 🔑 FLAT CONTRACT (Terminal-safe)
    taskId,
    intent: input,
    source,
    summary: "Build a basic Settings UI with an Autonomy toggle",

    files,

    // 🔒 SAFEGUARDS (THIS IS IMPORTANT)
    safeguards: {
      dryRun: true,              // Cannot apply from plan phase
      applyChanges: false,       // Enforced server-side
      requiresApproval: true,    // Human-in-the-loop
      immutablePlan: true,       // Plan must match checksum to apply
    },

    // 🔍 FUTURE EXTENSION POINTS
    diffPreview: "Not generated (V1 planner)",
    checksum,

    capabilities: {
      canApply: false,
      canModifyFiles: false,
      canEscalate: false,
      phase: "PLAN_ONLY",
    },

    nextStep: "Await human approval before apply phase",
  });
}
