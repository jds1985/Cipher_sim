// pages/api/siva-status.js
// SIVA — Authoritative Status (Vercel-safe)

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json({
    status: "SIVA_STATUS_OK",
    environment: "vercel",

    routes: {
      "siva-plan": true,
      "siva-generate": false,
      "siva-apply": false,
      "siva-commit": false
    },

    capabilities: {
      canPlan: true,
      canGenerate: false,
      canApply: false,
      canWriteFiles: false,
      canCommit: false,
      canRedeploy: false
    },

    mode: "PLANNER_ONLY",
    message: "Siva planner online. Generation gated."
  });
}
