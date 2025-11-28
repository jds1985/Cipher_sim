// pages/api/profile.js
import {
  generateAnonUserId,
  loadOrCreateProfile,
  updateProfile as saveProfile
} from "../../cipher_core/profile";

export default async function handler(req, res) {
  try {
    // LOAD PROFILE (called by index.js with GET)
    if (req.method === "GET") {
      const userId =
        req.headers["x-user-id"] ||
        req.query.userId ||
        "guest_default";

      const profile = await loadOrCreateProfile(userId);
      return res.status(200).json({ profile });
    }

    // UPDATE PROFILE (index.js uses PATCH)
    if (req.method === "PATCH") {
      const userId =
        req.headers["x-user-id"] ||
        req.query.userId ||
        "guest_default";

      const updates = req.body || {};

      await saveProfile(userId, updates);
      const profile = await loadOrCreateProfile(userId);

      return res.status(200).json({ profile });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Profile API error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
