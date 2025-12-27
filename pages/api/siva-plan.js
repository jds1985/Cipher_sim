// pages/api/siva-plan.js
// SIVA — PLAN PHASE (PHASE 1 ROUTER)
// READ-ONLY BY DEFAULT · ESCALATES ONLY ON EXPLICIT HUMAN INTENT

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

  // 🔓 Explicit escalation keywords (REQUIRED for apply-capable plans)
  const wantsImplementation =
    intent.includes("implement") ||
    intent.includes("build and implement") ||
    intent.includes("apply") ||
    intent.includes("commit");

  let summary = "";
  let files = [];
  let planType = "NO_OP";

  // ======================================================
  // 🧭 PHASE 1 INTENT ROUTER (EXPLICIT, SAFE)
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
          "Primary Cipher Chat UI with message bubbles, typing indicator, scrollable history",
        mode: wantsImplementation ? "FULL_CONTENT" : "DESIGN_ONLY",
      },
      {
        path: "components/ChatMessage.js",
        action: "CREATE",
        description: "Message bubble component (user vs Cipher)",
        mode: wantsImplementation ? "FULL_CONTENT" : "DESIGN_ONLY",
      },
      {
        path: "components/TypingIndicator.js",
        action: "CREATE",
        description: "Animated typing indicator for Cipher responses",
        mode: wantsImplementation ? "FULL_CONTENT" : "DESIGN_ONLY",
      },
    ];
  }

  // --- SETTINGS UI ---
  else if (intent.includes("settings")) {
    planType = "SETTINGS_UI_PLAN";
    summary = wantsImplementation
      ? "Implement settings UI with autonomy toggle"
      : "Design settings UI with autonomy toggle";

    files = [
      {
        path: "pages/settings.js",
        action: "CREATE_OR_UPDATE",
        description: "Settings page UI with Autonomy toggle",
        mode: wantsImplementation ? "FULL_CONTENT" : "DESIGN_ONLY",
      },
      {
        path: "components/AutonomyToggle.js",
        action: "CREATE",
        description: "Reusable autonomy on/off switch",
        mode: wantsImplementation ? "FULL_CONTENT" : "DESIGN_ONLY",
      },
    ];
  }

  // --- SANDBOX TERMINAL ---
  else if (intent.includes("sandbox")) {
    planType = "SANDBOX_PLAN";
    summary = "Design Sandbox Terminal (read-only, simulation only)";

    files = [
      {
        path: "pages/sandbox.js",
        action: "CREATE",
        description:
          "Sandbox Terminal UI for Cipher analysis and simulation (NO APPLY)",
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

  // --- BLOCKED META REQUESTS ---
  else if (
    intent.includes("self evolve") ||
    intent.includes("modify siva") ||
    intent.includes("change planner")
  ) {
    planType = "BLOCKED_META";
    summary =
      "Meta-evolution requests are blocked in Phase 1 (proposal-only later)";
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
  // 📤 RESPONSE
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
      dryRun: !wantsImplementation,
      applyChanges: wantsImplementation,
      requiresApproval: true,
      immutablePlan: true,
      selfModification: false,
    },

    checksum,

    capabilities: {
      canApply: wantsImplementation,
      canModifyFiles: wantsImplementation,
      canSelfEvolve: false,
      allowedNext: wantsImplementation
        ? ["APPLY_PHASE"]
        : ["DESIGN_REVIEW"],
    },

    nextStep: wantsImplementation
      ? "Human approval → apply phase"
      : "Human review → refine or escalate with IMPLEMENT keyword",
  });
}
