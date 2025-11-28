// pages/api/profile.js
// Unified REST-style Profile API (GET + PATCH)

import {
  generateAnonUserId,
  loadOrCreateProfile,
  updateProfile as saveProfile,
  addCYC,
  subtractCYC,
} from "../../cipher_core/profile";

export default async function handler(req, res) {
  try {
    // ----------------------------------------
    // GET — LOAD PROFILE
    // ----------------------------------------
    if (req.method === "GET") {
      const userId = req.query.userId || "guest_default";
      const profile = await loadOrCreateProfile(userId);
      return res.status(200).json({ profile });
    }

    // ----------------------------------------
    // PATCH — UPDATE PROFILE
    // ----------------------------------------
    if (req.method === "PATCH") {
      const updates = req.body || {};
      const userId = updates.userId || "guest_default";

      await saveProfile(userId, updates);
      const profile = await loadOrCreateProfile(userId);

      return res.status(200).json({ profile });
    }

    // ----------------------------------------
    // LEGACY POST ROUTE SUPPORT
    // (your app may still use these)
    // ----------------------------------------
    if (req.method === "POST") {
      const { action, userId, updates, amount } = req.body;

      switch (action) {
        case "newId":
          return res.status(200).json({ userId: generateAnonUserId() });

        case "load":
          if (!userId) return res.status(400).json({ error: "Missing userId" });
          return res.status(200).json({
            profile: await loadOrCreateProfile(userId),
          });

        case "update":
          if (!userId) return res.status(400).json({ error: "Missing userId" });
          await saveProfile(userId, updates || {});
          return res.status(200).json({
            profile: await loadOrCreateProfile(userId),
          });

        case "addCYC":
          if (!userId) return res.status(400).json({ error: "Missing userId" });
          return res.status(200).json({
            cycBalance: await addCYC(userId, amount || 0),
          });

        case "subtractCYC":
          if (!userId) return res.status(400).json({ error: "Missing userId" });
          return res.status(200).json({
            cycBalance: await subtractCYC(userId, amount || 0),
          });

        default:
          return res.status(400).json({ error: "Unknown action" });
      }
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Profile API error:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}
