// pages/api/fb/post.js
import { publishPagePost } from "../../../lib/facebook";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing 'message' string" });
    }

    const fbRes = await publishPagePost(message);
    return res.status(200).json({ success: true, fbRes });
  } catch (err) {
    console.error("[API fb/post] error:", err);
    return res.status(500).json({ error: "Failed to publish to FB" });
  }
}
