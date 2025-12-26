// pages/api/siva-plan.js
// SIVA — PLAN PHASE (PHASE 1 ROUTER)
// READ-ONLY · NO COMMITS · HUMAN APPROVAL REQUIRED

import crypto from "crypto";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: "METHOD_NOT_ALLOWED" });
  }

  const { instruction, command, source = "terminal" } = req.body || {};
  const input = instruction || command;

  if (!input || typeof input !== "string") {
    return res.status(400).json({
      status: "INVALID_COMMAND",
      error: "Missing or invalid instruction/command string",
    });
  }

  const taskId = "SIVA_PLAN_" + Date.now();
  const intentRaw = input.trim();
  const intent = intentRaw.toLowerCase();

  let summary = "";
  let files = [];
  let planType = "NO_OP";

  // ======================================================
  // 🧭 PHASE 1 INTENT ROUTER (EXPLICIT, NON-AMBIENT)
  // ======================================================

  // --- CHAT UI PLANNING ---
  if (
    intent.includes("chat ui") ||
    intent.includes("restore chat") ||
    intent.includes("cipher chat")
  ) {
    planType = "CHAT_UI_PLAN";
    summary = "Plan improvements to Cipher Chat UI (cyberpunk terminal aesthetic)";

    files = [
      {
        path: "pages/index.js",
        action: "CREATE_OR_UPDATE",
        description:
          "Primary Cipher Chat UI with message bubbles, typing indicator, scrollable history (planned)",
        mode: "DESIGN_ONLY", // 🔑 critical
      },
      {
        path: "components/ChatMessage.js",
        action: "CREATE",
        description: "Message bubble component (user vs Cipher)",
        mode: "DESIGN_ONLY",
      },
      {
        path: "components/TypingIndicator.js",
        action: "CREATE",
        description: "Animated typing indicator for Cipher responses",
        mode: "DESIGN_ONLY",
      },
    ];
  }

  // --- SETTINGS UI ---
  else if (intent.includes("settings")) {
    planType = "SETTINGS_UI_PLAN";
    summary = "Build settings UI with Autonomy toggle";

    files = [
      {
        path: "pages/settings.js",
        action: "CREATE_OR_UPDATE",
        description: "Settings page UI with Autonomy toggle",
        mode: "FULL_CONTENT",
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
        mode: "FULL_CONTENT",
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

  // --- SANDBOX TERMINAL (READ-ONLY REASONING SPACE) ---
  else if (intent.includes("sandbox")) {
    planType = "SANDBOX_PLAN";
    summary = "Design Sandbox Terminal (read-only, simulation, no writes)";

    files = [
      {
        path: "pages/sandbox.js",
        action: "CREATE",
        description:
          "Sandbox Terminal UI for Cipher analysis, simulation, and risk reasoning",
        mode: "DESIGN_ONLY",
      },
      {
        path: "pages/api/sandbox-analyze.js",
        action: "CREATE",
        description:
          "Read-only analysis endpoint (no filesystem writes, no apply)",
        mode: "DESIGN_ONLY",
      },
    ];
  }

  // --- CORE / META REQUESTS (BLOCKED BY DESIGN) ---
  else if (
    intent.includes("self evolve") ||
    intent.includes("modify siva") ||
    intent.includes("change planner")
  ) {
    planType = "BLOCKED_META";
    summary =
      "Meta-evolution requests are not allowed in Phase 1 (proposal-only later)";
    files = [];
  }

  // --- SAFE NO-OP ---
  else {
    planType = "NO_OP";
    summary = "No actionable intent detected (safe no-op)";
    files = [];
  }

  // ======================================================
  // 🔒 CHECKSUM (IMMUTABLE PLAN GUARANTEE)
  // ======================================================

  const checksum = crypto
    .createHash("sha256")
    .update(JSON.stringify({ planType, files }))
    .digest("hex");

  // ======================================================
  // 📤 RESPONSE (TERMINAL-SAFE, FLAT)
  // ======================================================

  return res.status(200).json({
    status: "SIVA_PLAN_OK",
    phase: "PHASE_1_ROUTER",

    time: new Date().toISOString(),
    taskId,
    intent: intentRaw,
    source,

    planType,
    summary,
    files,

    safeguards: {
      dryRun: true,
      applyChanges: false,
      requiresApproval: true,
      immutablePlan: true,
      selfModification: false,
    },

    checksum,

    capabilities: {
      canApply: false,
      canModifyFiles: false,
      canSelfEvolve: false,
      allowedNext:
        planType === "SANDBOX_PLAN"
          ? ["SANDBOX_IMPLEMENTATION"]
          : ["UI_IMPLEMENTATION"],
    },

    nextStep: "Human review → selective approval → apply phase",
  });
}
