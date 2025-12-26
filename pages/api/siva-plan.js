// pages/api/siva-plan.js
// SIVA — PLAN PHASE (READ-ONLY, NO COMMITS)

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      status: "METHOD_NOT_ALLOWED",
    });
  }

  const { instruction, command } = req.body || {};
  const input = instruction || command;

  if (!input || typeof input !== "string") {
    return res.status(400).json({
      status: "INVALID_COMMAND",
      error: "Missing or invalid instruction/command string",
    });
  }

  const taskId = "SIVA_PLAN_" + Date.now();

  return res.status(200).json({
    status: "SIVA_PLAN_OK",
    time: new Date().toISOString(),

    // 🔑 FLATTENED CONTRACT (this is the key)
    taskId,
    summary: "Build a basic Settings UI with an Autonomy toggle",
    intent: input,

    files: [
      {
        path: "pages/settings.js",
        action: "CREATE_OR_UPDATE",
        description: "Settings page UI with Autonomy toggle",
        content: `
export default function Settings() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Settings</h1>
      <label>
        <input type="checkbox" /> Autonomy Enabled
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
export default function AutonomyToggle({ value, onChange }) {
  return (
    <label>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      Autonomy
    </label>
  );
}
        `.trim(),
      },
    ],

    safeguards: {
      applyChanges: false,
      requiresApproval: true,
    },

    nextStep: "Await human approval before apply phase",
  });
}
