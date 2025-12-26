// pages/api/siva-plan.js
// SIVA — PLAN PHASE (READ-ONLY, NO COMMITS, HUMAN APPROVAL REQUIRED)

import crypto from "crypto";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: "METHOD_NOT_ALLOWED" });
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
  const intent = input.toLowerCase();

  let files = [];
  let summary = "";

  // ======================================================
  // 🔀 INTENT ROUTER (DETERMINISTIC V1)
  // ======================================================

  if (intent.includes("chat") || intent.includes("restore")) {
    summary = "Restore main chat UI with cyberpunk terminal aesthetic";

    files = [
      {
        path: "pages/index.js",
        action: "CREATE_OR_UPDATE",
        description: "Primary Cipher chat UI",
        content: `
export default function Chat() {
  return (
    <div style={{
      background: "#000",
      color: "#0f0",
      minHeight: "100vh",
      padding: "20px",
      fontFamily: "monospace"
    }}>
      <h1>CIPHER CHAT</h1>

      <div style={{
        border: "1px solid #0f0",
        padding: "10px",
        height: "60vh",
        overflowY: "auto",
        marginBottom: "10px"
      }}>
        <p>&gt; System online.</p>
        <p>&gt; Awaiting input...</p>
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <textarea
          placeholder="Type message..."
          style={{
            flex: 1,
            background: "#000",
            color: "#0f0",
            border: "1px solid #0f0",
            padding: "10px"
          }}
        />
        <button style={{
          background: "#0f0",
          color: "#000",
          fontWeight: "bold",
          padding: "10px 20px"
        }}>
          SEND
        </button>
      </div>
    </div>
  );
}
        `.trim(),
      },
    ];
  }

  else if (intent.includes("settings")) {
    summary = "Build settings UI with Autonomy toggle";

    files = [
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
  }

  else {
    summary = "No actionable intent detected (safe no-op)";
    files = [];
  }

  // ======================================================
  // 🔒 INTEGRITY CHECKSUM (ANTI-TAMPER)
  // ======================================================

  const checksum = crypto
    .createHash("sha256")
    .update(JSON.stringify(files))
    .digest("hex");

  // ======================================================
  // ✅ RESPONSE (FLAT, TERMINAL-SAFE)
  // ======================================================

  return res.status(200).json({
    status: "SIVA_PLAN_OK",
    time: new Date().toISOString(),

    taskId,
    intent: input,
    source,
    summary,

    files,

    safeguards: {
      dryRun: true,
      applyChanges: false,
      requiresApproval: true,
      immutablePlan: true,
    },

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
