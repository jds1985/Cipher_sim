// pages/api/realtime.js
// Cipher Realtime Voice — GPT-5.1 Realtime

import { OpenAI } from "openai";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create a Realtime Session
    const session = await client.realtime.sessions.create({
      model: "gpt-5.1-realtime",
      voice: "natural",
      instructions:
        "You are Cipher. Speak naturally, emotionally, and like a real human.",
    });

    // Upgrade to WebSocket for streaming voice
    const upgrade = req.socket.server;
    upgrade.on("upgrade", function (request, socket, head) {
      if (request.url === "/api/realtime") {
        session.connectWebSocket({ request, socket, head });
      }
    });

    res.status(200).json({ status: "Realtime voice session active" });
  } catch (error) {
    console.error("Realtime voice error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
