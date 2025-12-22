// pages/api/voice.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { text } = req.body;

    if (!text || text.length < 1) {
      return res.status(400).json({ error: "No text provided" });
    }

    // Request audio from OpenAI
    const audio = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",   // temporary voice model
      voice: "alloy",             // placeholder until Liz's voice is ready
      input: text,
      format: "mp3",
    });

    const buffer = Buffer.from(await audio.arrayBuffer());

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.length);
    res.status(200).send(buffer);

  } catch (err) {
    console.error("Voice API Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}