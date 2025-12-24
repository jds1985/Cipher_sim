import fs from "fs";
import path from "path";

import {
  planBuildTask,
  generateFileEdit,
  validateTargetPath
} from "../../../logic/sivaSwarm.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    }

    const { instruction, targetPath, content } = req.body;

    if (!instruction || !targetPath || !content) {
      return res.status(400).json({ error: "MISSING_FIELDS" });
    }

    if (!validateTargetPath(targetPath)) {
      return res.status(403).json({ error: "PATH_NOT_ALLOWED" });
    }

    const fullPath = path.join(process.cwd(), targetPath);

    fs.writeFileSync(fullPath, content, "utf8");

    return res.status(200).json({
      status: "SIVA_WRITE_OK",
      path: targetPath
    });
  } catch (err) {
    console.error("SIVA_SPINE_ERROR:", err);
    return res.status(500).json({
      error: err.message || "SIVA_FAILURE"
    });
  }
}
