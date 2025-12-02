// pages/api/social_post.js
// Cipher → Facebook Posting API

import { publishToFacebook } from "../../utils/facebook";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing or invalid message" });
    }

    // --- CALL FACEBOOK UTILITY ---
    const fbResponse = await publishToFacebook(message);

    if (!fbResponse.success) {
      return res.status(500).json({
        ok: false,
        error: fbResponse.error
      });
    }

    return res.status(200).json({
      ok: true,
      postId: fbResponse.postId,
      message: "Posted successfully to Facebook."
    });

  } catch (err) {
    console.error("SOCIAL POST ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Internal error in social_post route."
    });
  }
}
