// pages/api/cipher_autonomy.js
// Cipher Autonomy API — trigger one autonomy cycle

import { runAutonomyCycle } from "../../utils/cipherAutonomy";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { dryRun } = req.body || {};

    const result = await runAutonomyCycle({
      dryRun: !!dryRun,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("cipher_autonomy route error:", err);
    return res.status(500).json({
      ok: false,
      error: "Autonomy route failed",
      details: String(err),
    });
  }
}
