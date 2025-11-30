// pages/api/device_log.js
// Store device snapshots so Cipher can reason about phone conditions.

import { db } from "../../firebaseAdmin";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { snapshot } = req.body;

    if (!snapshot || typeof snapshot !== "object") {
      return res.status(400).json({ error: "Missing or invalid snapshot" });
    }

    await db.collection("device_logs").add({
      snapshot,
      createdAt: Date.now(),
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("DEVICE LOG ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to store device snapshot.",
      details: String(err),
    });
  }
}
