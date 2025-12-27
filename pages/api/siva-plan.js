// pages/api/siva-plan.js
// SIVA — PLAN PHASE
// Intent Router · Safe Planner · No Commits
// Dark. Calm. In control.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { instruction, source = "terminal" } = req.body || {};

  if (!instruction || typeof instruction !== "string") {
    return res.status(400).json({
      status: "INVALID_REQUEST",
      error: "Missing instruction string",
    });
  }

  const intentRaw = instruction.trim();
  const intent = intentRaw.toLowerCase();
  const taskId = "SIVA_" + Date.now();

  // ─────────────────────────────────────────────
  // 🧠 INTENT DETECTION
  // ─────────────────────────────────────────────

  const wantsApply =
    intent.includes("implement") ||
    intent.includes("apply") ||
    intent.includes("commit");

  const wantsSettings = intent.includes("settings");
  const wantsAutonomy = intent.includes("autonomy");

  let summary = "No actionable intent detected";
  let files = [];

  // ─────────────────────────────────────────────
  // 🖤 SETTINGS PAGE
  // ─────────────────────────────────────────────

  if (wantsSettings) {
    summary = wantsApply
      ? "Implement settings page with autonomy toggle"
      : "Design settings page with autonomy toggle";

    files.push({
      path: "pages/settings.js",
      action: "CREATE_OR_UPDATE",
      description: "Settings page UI with autonomy toggle",
      mode: wantsApply ? "FULL_CONTENT" : "DESIGN_ONLY",
      content: wantsApply
        ? `
import AutonomyToggle from "../components/AutonomyToggle";

export default function Settings() {
  return (
    <div style={{
      padding: "24px",
      background: "#000",
      color: "#0f0",
      minHeight: "100vh",
      fontFamily: "monospace"
    }}>
      <h1>Settings</h1>

      <div style={{
        marginTop: "20px",
        border: "1px solid #0f0",
        padding: "12px",
        maxWidth: "320px"
      }}>
        <AutonomyToggle />
      </div>
    </div>
  );
}
        `.trim()
        : undefined,
    });

    files.push({
      path: "components/AutonomyToggle.js",
      action: "CREATE_OR_UPDATE",
      description: "Reusable autonomy toggle component",
      mode: wantsApply ? "FULL_CONTENT" : "DESIGN_ONLY",
      content: wantsApply
        ? `
export default function AutonomyToggle({ value = false, onChange }) {
  return (
    <label style={{
      display: "flex",
      gap: "8px",
      alignItems: "center",
      cursor: "pointer"
    }}>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      Autonomy Enabled
    </label>
  );
}
        `.trim()
        : undefined,
    });
  }

  // ─────────────────────────────────────────────
  // 📤 RESPONSE
  // ─────────────────────────────────────────────

  return res.status(200).json({
    status: "SIVA_PLAN_OK",
    phase: "PLAN",

    taskId,
    time: new Date().toISOString(),
    source,
    intent: intentRaw,

    summary,
    files,

    safeguards: {
      planOnly: !wantsApply,
      requiresHumanApproval: true,
      selfModification: false,
    },

    capabilities: {
      canApply: wantsApply,
    },

    nextStep: wantsApply
      ? "Review diff → Approve & Apply"
      : "Use IMPLEMENT to enable apply",
  });
}
