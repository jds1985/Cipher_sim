// pages/api/siva-status.js
// SIVA — Truthful Runtime Status

import fs from "fs";
import path from "path";

function routeExists(route) {
  return fs.existsSync(
    path.join(process.cwd(), "pages", "api", route)
  );
}

export default function handler(req, res) {
  const routes = {
    "siva-plan": routeExists("siva-plan.js"),
    "siva-generate": routeExists("siva-generate.js"),
    "siva-apply": routeExists("siva-apply.js"),
    "siva-commit": routeExists("siva-commit.js"),
    "diag-spine": routeExists("diag-spine.js"),
    "diagnostic": routeExists("diagnostic.js")
  };

  return res.status(200).json({
    status: "SIVA_STATUS_OK",
    environment: "vercel",
    routes,
    capabilities: {
      canPlan: routes["siva-plan"],
      canGenerate: routes["siva-generate"],
      canApply: routes["siva-apply"],
      canWriteFiles: routes["siva-apply"],
      canCommit: routes["siva-commit"],
      canRedeploy: false
    }
  });
}
