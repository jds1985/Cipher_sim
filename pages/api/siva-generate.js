// pages/api/siva-generate.js

import { generateTaskCode } from "../../logic/sivaSwarm";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  const { taskId, route } = req.body;

  if (!taskId || !route) {
    return res.status(400).json({ error: "MISSING_FIELDS" });
  }

  try {
    const output = await generateTaskCode({ taskId, route });

    return res.status(200).json({
      status: "SIVA_GENERATE_OK",
      output
    });
  } catch (err) {
    console.error("SIVA_GENERATE_ERROR:", err);
    return res.status(500).json({
      error: err.message || "GENERATION_FAILED"
    });
  }
}
