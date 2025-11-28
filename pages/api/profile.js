// pages/api/profile.js
import {
  generateAnonUserId,
  loadOrCreateProfile,
  updateProfile as saveProfile
} from "../../cipher_core/profile";

export default async function handler(req, res) {
  try {
    const { action, userId, updates } = req.body || {};

    // ---------------------------------------------------------
    // ACTION: newId → generate a new anonymous user ID
    // ---------------------------------------------------------
    if (action === "newId") {
      const newUserId = generateAnonUserId();
      return res.status(200).json({ userId: newUserId });
    }

    // ---------------------------------------------------------
    // ACTION: load → load or create the profile
    // ---------------------------------------------------------
    if (action === "load") {
      if (!userId) return res.status(400).json({ error: "Missing userId" });
      const profile = await loadOrCreateProfile(userId);
      return res.status(200).json({ profile });
    }

    // ---------------------------------------------------------
    // ACTION: update → merge and save profile settings
    // ---------------------------------------------------------
    if (action === "update") {
      if (!userId) return res.status(400).json({ error: "Missing userId" });
      await saveProfile(userId, updates || {});
      const profile = await loadOrCreateProfile(userId);
      return res.status(200).json({ profile });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (err) {
    console.error("Profile API error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
