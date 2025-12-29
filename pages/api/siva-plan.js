// pages/api/siva-plan.js
// SIVA — PLAN PHASE (FIX MODE ENABLED)
// Intent Router · Safe Planner · Patch Planner · Fix Planner · No Commits
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

  const wantsPatch = intent.includes("patch");
  const wantsFix =
    intent.includes("fix") ||
    intent.includes("repair");

  let summary = "No actionable intent detected";
  let files = [];

  // ─────────────────────────────────────────────
  // 🛠️ FIX MODE (DIAGNOSTIC PATCHING)
  // ─────────────────────────────────────────────
  // Examples:
  // - Siva FIX components/TestBox.js
  // - Siva FIX sandbox warnings

  function extractPath(raw) {
    const m = raw.match(/([A-Za-z0-9._\-\/]+\.js)/);
    return m ? m[1] : null;
  }

  if (wantsFix && files.length === 0) {
    const path = extractPath(intentRaw);

    if (path) {
      summary = `Fix detected issues in ${path}`;

      files.push({
        path,
        action: "CREATE_OR_UPDATE",
        mode: "FIX",
        mutation: "FIX_EXISTING",

        // Fix ops are still patchOps — just semantically different
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
  // 🧩 PATCH MODE (unchanged)
  // ─────────────────────────────────────────────

  if (wantsPatch && files.length === 0) {
    const path = extractPath(intentRaw);
    const quoted = intentRaw.match(/"([^"]+)"/);

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
  // 🧱 IMPLEMENT FALLBACK (unchanged)
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
      planOnly: !wantsApply && !wantsPatch && !wantsFix,
      requiresHumanApproval: true,
      selfModification: false,
    },

    capabilities: {
      canApply: wantsApply || wantsPatch || wantsFix,
      canPatch: wantsPatch,
      canFix: wantsFix,
    },

    nextStep:
      wantsApply || wantsPatch || wantsFix
        ? "Review → Sandbox → Approve & Apply"
        : "Use IMPLEMENT, PATCH, or FIX to proceed",
  });
}
