// pages/api/siva-plan.js
// SIVA — PLAN PHASE (UPGRADED)
// Intent Router · Safe Planner · Patch Planner (Step 2) · No Commits
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
  // 🧩 PATCH PARSER (Step 2)
  // Supports: Siva PATCH <path> add a line saying "..."
  // Produces deterministic patchOps (no full overwrite)
  // ─────────────────────────────────────────────

  function parseQuotedText(s) {
    const m = s.match(/"([^"]+)"/);
    return m ? m[1] : null;
  }

  function extractPath(raw) {
    // Accepts paths like components/TestBox.js or pages/foo.js
    const m = raw.match(/([A-Za-z0-9._\-\/]+\.js)/);
    return m ? m[1] : null;
  }

  if (wantsPatch && files.length === 0) {
    const path = extractPath(intentRaw);

    if (path) {
      const sayText = parseQuotedText(intentRaw);

      summary = sayText
        ? `Patch ${path}: add line "${sayText}"`
        : `Patch ${path}: requested mutation`;

      // Default deterministic patch: insert a string line after a known safe anchor.
      // This matches what you tested successfully in TestBox.
      const patchOps = [];

      if (sayText) {
        patchOps.push({
          op: "INSERT_AFTER",
          // anchor: common pattern in our generated components
          match: `{children || "Component active."}`,
          insert: `\n          "${sayText}"`,
          once: true,
        });
      }

      // If no quoted string, still create a placeholder op that will fail safely
      if (patchOps.length === 0) {
        patchOps.push({
          op: "FAIL_SAFE",
          reason:
            'No quoted string found. Use: Siva PATCH <path> add a line saying "..."',
        });
      }

      files.push({
        path,
        action: "CREATE_OR_UPDATE",
        mode: "PATCH", // 👈 patch mode (Apply will accept this)
        mutation: "PATCH_EXISTING",
        patchOps,
      });
    }
  }

  // ─────────────────────────────────────────────
  // 🧱 GENERIC IMPLEMENT FALLBACK (unchanged)
  // ─────────────────────────────────────────────

  if (wantsApply && files.filter((f) => f.mode === "FULL_CONTENT").length === 0) {
    const match = intentRaw.match(/components\/([A-Za-z0-9_-]+)\.js/);

    if (match) {
      const componentName = match[1];
      const path = `components/${componentName}.js`;

      summary = `Implement ${path}`;

      files.push({
        path,
        action: "CREATE_OR_UPDATE",
        mode: "FULL_CONTENT",
        content: `
import { useState } from "react";

export default function ${componentName}({
  title = "${componentName}",
  children
}) {
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
      planOnly: !wantsApply && !wantsPatch,
      requiresHumanApproval: true,
      selfModification: false,
    },

    capabilities: {
      canApply: wantsApply || wantsPatch,
      canPatch: wantsPatch,
    },

    nextStep: wantsApply || wantsPatch
      ? "Review → Sandbox → Approve & Apply"
      : "Use IMPLEMENT or PATCH to enable apply",
  });
}
