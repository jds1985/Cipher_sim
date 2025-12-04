// pages/api/fb_exchange.js

import axios from "axios";

export default async function handler(req, res) {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: "No code provided" });
    }

    const client_id = process.env.FB_APP_ID;
    const client_secret = process.env.FB_APP_SECRET;
    const redirect_uri = "https://cipher-sim.vercel.app/api/fb_callback";

    // Exchange the code Facebook sent for an access token
    const tokenResponse = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token`,
      {
        params: {
          client_id,
          client_secret,
          redirect_uri,
          code,
        },
      }
    );

    return res.status(200).json({
      message: "Token received",
      token: tokenResponse.data,
    });
  } catch (err) {
    console.error("Token exchange error:", err.response?.data || err);
    return res.status(500).json({
      error: "Failed to exchange code for access token",
      details: err.response?.data || err.message,
    });
  }
}
