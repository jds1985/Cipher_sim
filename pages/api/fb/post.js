// pages/api/fb/post.js
// Post a message to Cipher's Facebook Page

import { postToFacebookPage } from "../../../utils/facebook";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await postToFacebookPage(message);

    return res.status(200).json({
      success: true,
      fbResponse: response,
    });

  } catch (err) {
    return res.status(500).json({
      error: "Failed to post to Facebook",
      details: err.message,
    });
  }
}
