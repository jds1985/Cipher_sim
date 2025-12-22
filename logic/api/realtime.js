// pages/api/realtime.js
// Fully working realtime voice endpoint

import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false,
  },
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Create a realtime session
    const session = await client.realtime.sessions.create({
      model: "gpt-4o-realtime-preview",   // WORKS TODAY
      modalities: ["audio", "text"],
      voice: "alloy",                     // Female voice
    });

    return res.status(200).json({ session });
  } catch (err) {
    console.error("Realtime error:", err);
    return res.status(500).json({
      error: "Failed to create realtime session",
      details: err?.response?.data || err.toString(),
    });
  }
}