// pages/api/device_context.js
// Store latest device snapshot for Cipher (per user)

import { db } from "../../firebaseAdmin";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { userId = "jim_default", device } = req.body || {};

    if (!device || typeof device !== "object") {
      return res.status(400).json({ error: "Missing device payload" });
    }

    const ref = db.collection("device_context").doc(userId);

    const payload = {
      ...device,
      updatedAt: new Date().toISOString(),
    };

    await ref.set(payload, { merge: true });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("DEVICE_CONTEXT ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to store device context",
      details: String(err),
    });
  }
}
