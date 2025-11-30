// pages/api/chat.js
// Cipher text chat – with memory, device context, history & optional voice

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, memory, history, deviceContext, voice } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "No message" });
    }

    // Map UI history into OpenAI format
    const historyMessages = Array.isArray(history)
      ? history
          .slice(-10)
          .map((m) => ({
            role: m.role === "cipher" ? "assistant" : "user",
            content: m.text || "",
          }))
      : [];

    const systemBase =
      "You are Cipher, an AI companion for Jim. " +
      "You speak in a calm, grounded, supportive tone. " +
      "Use the provided memory JSON as facts about Jim's life, projects, and goals. " +
      "If device context is present, you may reference battery, network, or screen details, " +
      "but do NOT claim broader access to the device than what is explicitly given.";

    const systemMemory = `User memory JSON:\n${JSON.stringify(
      memory || {},
      null,
      2
    )}`;

    const systemDevice = deviceContext
      ? `Current device context:\n${JSON.stringify(deviceContext, null, 2)}`
      : "No device context is currently linked.";

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemBase },
        { role: "system", content: systemMemory },
        { role: "system", content: systemDevice },
        ...historyMessages,
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ||
      "I'm here, Jim, but something went a bit quiet on my side.";

    let voiceBase64 = null;

    if (voice !== false) {
      try {
        const audio = await client.audio.speech.create({
          model: "gpt-4o-mini-tts",
          voice: "verse",
          input: reply,
        });
        const buffer = Buffer.from(await audio.arrayBuffer());
        voiceBase64 = buffer.toString("base64");
      } catch (e) {
        console.error("TTS error:", e);
      }
    }

    return res.status(200).json({ reply, voice: voiceBase64 });
  } catch (err) {
    console.error("chat error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
