// pages/api/voice.js
import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_CHARS = 4000; // protect costs & speed

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    let { text, voice = "alloy" } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "No text provided" });
    }

    // trim runaway prompts
    if (text.length > MAX_CHARS) {
      text = text.slice(0, MAX_CHARS);
    }

    const audio = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice,
      input: text,
      format: "mp3",
    });

    const buffer = Buffer.from(await audio.arrayBuffer());

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(buffer);

  } catch (err) {
    console.error("🔊 Voice API Error:", err?.message || err);
    res.status(500).json({
      error: "Voice synthesis failed",
      detail: err?.message,
    });
  }
}
