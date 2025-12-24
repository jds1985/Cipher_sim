// pages/api/siva-apply.js
// SIVA — APPLY (Write generated files to disk, NO git, NO deploy)

import fs from "fs";
import path from "path";

// 🔒 Allowed write roots (guardrails)
const ALLOWED_ROOTS = [
  "pages",
  "components",
  "logic",
  "cipher_core"
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { taskId, files, dryRun = false } = req.body;

    if (!taskId || !Array.isArray(files)) {
      return res.status(400).json({
        error: "Missing taskId or files[]"
      });
    }

    const written = [];
    const blocked = [];

    for (const file of files) {
      const filePath = file.path;
      const content = file.content ?? "";

      // 🚫 Block unsafe paths
      const isAllowed = ALLOWED_ROOTS.some(root =>
        filePath.startsWith(root + "/")
      );

      if (!isAllowed) {
        blocked.push(filePath);
        continue;
      }

      const absolutePath = path.join(process.cwd(), filePath);
      const dir = path.dirname(absolutePath);

      if (!dryRun) {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(absolutePath, content, "utf8");
      }

      written.push({
        path: filePath,
        bytes: content.length
      });
    }

    return res.status(200).json({
      status: "SIVA_APPLY_READY",
      taskId,
      dryRun,
      written,
      blocked,
      summary: {
        filesWritten: written.length,
        filesBlocked: blocked.length
      }
    });

  } catch (err) {
    console.error("SIVA APPLY ERROR:", err);
    return res.status(500).json({
      error: "Siva apply failed",
      details: err.message
    });
  }
}
