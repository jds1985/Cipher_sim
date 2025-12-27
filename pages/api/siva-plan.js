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
  // 🧭 PHASE 1 INTENT ROUTER (STRICT, EXPLICIT)
  // ======================================================

  // --- CHAT UI (PLAN ONLY) ---
  if (
    intent.includes("chat") &&
    (intent.includes("plan") || intent.includes("ui"))
  ) {
    planType = "CHAT_UI_PLAN";
    summary = "Plan Cipher Chat UI improvements (cyberpunk terminal aesthetic)";

    files = [
      {
        path: "pages/index.js",
        action: "DESCRIBE_ONLY",
        description:
          "Primary Cipher Chat UI with message bubbles, typing indicator, scrollable history",
      },
      {
        path: "components/ChatMessage.js",
        action: "DESCRIBE_ONLY",
        description: "Message bubble component (user vs Cipher)",
      },
      {
        path: "components/TypingIndicator.js",
        action: "DESCRIBE_ONLY",
        description: "Animated typing indicator for Cipher responses",
      },
    ];
  }

  // --- SANDBOX TERMINAL (READ-ONLY) ---
  else if (intent.includes("sandbox")) {
    planType = "SANDBOX_PLAN";
    summary =
      "Design Sandbox Terminal (read-only reasoning, simulation, no writes)";

    files = [
      {
        path: "pages/sandbox.js",
        action: "DESCRIBE_ONLY",
        description:
          "Sandbox Terminal UI for Cipher analysis, simulation, and risk reasoning",
      },
      {
        path: "pages/api/sandbox-analyze.js",
        action: "DESCRIBE_ONLY",
        description:
          "Read-only analysis endpoint (no filesystem writes, no apply)",
      },
    ];
  }

  // --- THREE TERMINAL ARCHITECTURE ---
  else if (
    intent.includes("three terminal") ||
    intent.includes("3 terminal")
  ) {
    planType = "THREE_TERMINAL_PLAN";
    summary =
      "Define architecture for Chat, Sandbox, and SIVA terminals with routing boundaries";

    files = [
      {
        path: "ARCHITECTURE::CHAT",
        action: "DESCRIBE_ONLY",
        description:
          "User-facing conversational interface (no planning, no apply)",
      },
      {
        path: "ARCHITECTURE::SANDBOX",
        action: "DESCRIBE_ONLY",
        description:
          "Read-only simulation and analysis environment (no writes)",
      },
      {
        path: "ARCHITECTURE::SIVA",
        action: "DESCRIBE_ONLY",
        description:
          "Planner + Applier with strict approval gate and routing enforcement",
      },
    ];
  }

  // --- BLOCKED META / SELF-MOD ---
  else if (
    intent.includes("self evolve") ||
    intent.includes("modify siva") ||
    intent.includes("change planner")
  ) {
    planType = "BLOCKED_META";
    summary =
      "Self-modification is blocked in Phase 1 (proposal-only later)";
    files = [];
  }

  // --- SAFE NO-OP ---
  else {
    planType = "NO_OP";
    summary = "No actionable intent detected (safe no-op)";
    files = [];
  }

  // ======================================================
  // 🔒 IMMUTABLE CHECKSUM
  // ======================================================

  const checksum = crypto
    .createHash("sha256")
    .update(JSON.stringify({ planType, files }))
    .digest("hex");

  // ======================================================
  // 📤 RESPONSE (PLAN-ONLY, APPLY-SAFE)
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

    // 🔑 THIS IS CRITICAL FOR APPLY BUTTON LOGIC
    applyEligibleFiles: files.filter(
      (f) => f.action !== "DESCRIBE_ONLY"
    ),

    safeguards: {
      dryRun: true,
      requiresApproval: true,
      immutablePlan: true,
      noFilesystemWrites: true,
      noSelfModification: true,
    },

    checksum,

    capabilities: {
      canApply: false,
      canModifyFiles: false,
      canSelfEvolve: false,
      nextPhase:
        planType === "THREE_TERMINAL_PLAN"
          ? "PHASE_2_IMPLEMENTATION"
          : "PHASE_1_IMPLEMENTATION",
    },

    nextStep:
      "Review plan → approve specific files → send approved payload to /api/siva-apply",
  });
}
