// pages/api/fb_post.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Missing message text" });
  }

  const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
  const PAGE_TOKEN = process.env.FACEBOOK_PAGE_TOKEN;

  const url = `https://graph.facebook.com/v24.0/${PAGE_ID}/feed`;

  try {
    const fbRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        access_token: PAGE_TOKEN,
      }),
    });

    const data = await fbRes.json();

    if (data.error) {
      return res.status(500).json({ error: data.error });
    }

    return res.status(200).json({ success: true, post_id: data.id });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
