import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const root = process.cwd();

    // Known Siva endpoints to check
    const endpoints = [
      "pages/api/siva-plan.js",
      "pages/api/siva-generate.js",
      "pages/api/siva-apply.js",
      "pages/api/diag-spine.js",
      "pages/api/diagnostic.js"
    ];

    const routeStatus = {};

    for (const file of endpoints) {
      const fullPath = path.join(root, file);
      routeStatus[file.replace("pages/api/", "").replace(".js", "")] =
        fs.existsSync(fullPath);
    }

    return res.status(200).json({
      status: "SIVA_STATUS_OK",
      environment: "vercel",
      cwd: root,
      routes: routeStatus,
      capabilities: {
        canPlan: routeStatus["siva-plan"] === true,
        canGenerate: routeStatus["siva-generate"] === true,
        canApply: routeStatus["siva-apply"] === true,
        canWriteFiles: true,
        canCommit: false,
        canRedeploy: false
      },
      nextAction: routeStatus["siva-generate"]
        ? "READY_FOR_GENERATION"
        : "GENERATOR_NOT_DEPLOYED"
    });
  } catch (err) {
    return res.status(500).json({
      status: "SIVA_STATUS_ERROR",
      error: err.message
    });
  }
}
