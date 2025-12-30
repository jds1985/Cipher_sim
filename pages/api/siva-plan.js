// pages/api/siva-plan.js
// SIVA — PLAN PHASE (THINK + FIX + PATCH + APPLY)
// Intent Router · Cognitive Planner · Safe Executor
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

  const wantsThink =
    intent.includes("think") ||
    intent.includes("analyze") ||
    intent.includes("reason");

  const wantsApply =
    intent.includes("implement") ||
    intent.includes("apply") ||
    intent.includes("commit");

  const wantsPatch = intent.includes("patch");
  const wantsFix =
    intent.includes("fix") ||
    intent.includes("repair");

  let summary = "No actionable intent detected";
  let files = [];
  let thoughts = null;

  // ─────────────────────────────────────────────
  // 🧠 THINK MODE (COGNITION ONLY — NO FILES)
  // ─────────────────────────────────────────────

  if (wantsThink) {
    summary = "Cognitive analysis requested";

    thoughts = [
      "Chat and voice likely broke due to API route mismatch or missing client hydration",
      "Terminal works because it bypasses chat pipeline",
      "Fix order should be: API health → chat UI state → voice binding",
      "Once chat responds, voice can be reattached safely",
      "SIVA should be used to PATCH incrementally, not bulk-fix",
    ];

    return res.status(200).json({
      status: "SIVA_THINK_OK",
      phase: "THINK",
      taskId,
      time: new Date().toISOString(),
      source,
      intent: intentRaw,
      summary,
      thoughts,
      files: [],
      safeguards: {
        planOnly: true,
        requiresHumanApproval: false,
        selfModification: false,
      },
      capabilities: {
        canThink: true,
        canApply: false,
        canPatch: false,
        canFix: false,
      },
      nextStep: "Convert insight → FIX or PATCH",
    });
  }

  // ─────────────────────────────────────────────
  // 🔎 PATH EXTRACTION
  // ─────────────────────────────────────────────

  function extractPath(raw) {
    const m = raw.match(/([A-Za-z0-9._\-\/]+\.js)/);
    return m ? m[1] : null;
  }

  // ─────────────────────────────────────────────
  // 🛠️ FIX MODE (DIAGNOSTIC ONLY)
  // ─────────────────────────────────────────────

  if (wantsFix && files.length === 0) {
    const path = extractPath(intentRaw);

    if (path) {
      summary = `Analyze and prepare safe fixes for ${path}`;

      files.push({
        path,
        action: "ANALYZE_ONLY",
        mode: "FIX",
        mutation: "FIX_EXISTING",
        fixStrategy: {
          scope: "SAFE_UI_FIXES",
          allowJSXWrap: true,
          allowLiteralNormalization: true,
          allowMissingKeyFix: true,
          allowWarningResolution: true,
        },
      });
    }
  }

  // ─────────────────────────────────────────────
  // 🧩 PATCH MODE (GUARDED)
  // ─────────────────────────────────────────────

  if (wantsPatch && files.length === 0) {
    const path = extractPath(intentRaw);
    const quoted = intentRaw.match(/"([^"]+)"/);

    if (path && !quoted) {
      return res.status(200).json({
        status: "SIVA_PLAN_REJECTED",
        phase: "PLAN",
        taskId,
        summary: "Patch rejected: missing quoted string",
        files: [],
        safeguards: {
          planOnly: true,
          requiresHumanApproval: true,
          selfModification: false,
        },
        capabilities: {
          canApply: false,
          canPatch: true,
          canFix: false,
        },
        nextStep: 'Use: Siva PATCH <path> add a line saying "..."',
      });
    }

    if (path && quoted) {
      summary = `Patch ${path}: add line "${quoted[1]}"`;

      files.push({
        path,
        action: "CREATE_OR_UPDATE",
        mode: "PATCH",
        mutation: "PATCH_EXISTING",
        patchOps: [
          {
            op: "INSERT_AFTER",
            match: `{children || "Component active."}`,
            insert: `\n          "${quoted[1]}"`,
            once: true,
          },
        ],
      });
    }
  }

  // ─────────────────────────────────────────────
  // 🧱 IMPLEMENT MODE (FULL CONTENT)
  // ─────────────────────────────────────────────

  if (wantsApply && files.filter(f => f.mode === "FULL_CONTENT").length === 0) {
    const match = intentRaw.match(/components\/([A-Za-z0-9_-]+)\.js/);

    if (match) {
      const name = match[1];
      const path = `components/${name}.js`;

      summary = `Implement ${path}`;

      files.push({
        path,
        action: "CREATE_OR_UPDATE",
        mode: "FULL_CONTENT",
        content: `
import { useState } from "react";

export default function ${name}({ title = "${name}", children }) {
  const [active, setActive] = useState(false);

  return (
    <div style={{
      padding: "20px",
      border: "1px solid #0f0",
      background: "#000",
      color: "#0f0",
      fontFamily: "monospace"
    }}>
      <h3>{title}</h3>

      <button
        onClick={() => setActive(!active)}
        style={{
          background: "#000",
          color: "#0f0",
          border: "1px solid #0f0",
          padding: "6px 10px",
          cursor: "pointer"
        }}
      >
        {active ? "Deactivate" : "Activate"}
      </button>

      {active && (
        <div style={{ marginTop: "12px" }}>
          {children || "Component active."}
        </div>
      )}
    </div>
  );
}
        `.trim(),
      });
    }
  }

  // ─────────────────────────────────────────────
  // 📤 RESPONSE
  // ─────────────────────────────────────────────

  const canApply = wantsApply || wantsPatch;

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
      planOnly: !canApply,
      requiresHumanApproval: true,
      selfModification: false,
    },
    capabilities: {
      canThink: false,
      canApply,
      canPatch: wantsPatch,
      canFix: wantsFix,
    },
    nextStep:
      wantsFix
        ? "Review diagnostics → Convert to PATCH or IMPLEMENT"
        : canApply
          ? "Review → Sandbox → Approve & Apply"
          : "Use THINK, FIX, PATCH, or IMPLEMENT",
  });
}
