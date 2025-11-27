// pages/api/profile.js
// Profile API — create, load, update, personalize

import {
  generateAnonUserId,
  loadOrCreateProfile,
  updateProfile,
  addCYC,
  subtractCYC,
} from "../../cipher_core/profile";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { action, userId, updates, amount } = req.body;

    switch (action) {
      case "newId": {
        return res.status(200).json({ userId: generateAnonUserId() });
      }

      case "load": {
        if (!userId) return res.status(400).json({ error: "Missing userId" });
        const profile = await loadOrCreateProfile(userId);
        return res.status(200).json({ profile });
      }

      case "update": {
        if (!userId) return res.status(400).json({ error: "Missing userId" });
        await updateProfile(userId, updates || {});
        const profile = await loadOrCreateProfile(userId);
        return res.status(200).json({ profile });
      }

      case "addCYC": {
        if (!userId) return res.status(400).json({ error: "Missing userId" });
        const balance = await addCYC(userId, amount || 0);
        return res.status(200).json({ cycBalance: balance });
      }

      case "subtractCYC": {
        if (!userId) return res.status(400).json({ error: "Missing userId" });
        const balance = await subtractCYC(userId, amount || 0);
        return res.status(200).json({ cycBalance: balance });
      }

      default:
        return res.status(400).json({ error: "Unknown action" });
    }
  } catch (err) {
    console.error("Profile API error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
