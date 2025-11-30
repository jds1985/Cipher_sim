// pages/api/vision_chat.js
// Cipher vision chat – image + memory + device → reply + optional TTS

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image, memory, history, deviceContext, voice } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image" });
    }

    const historyMessages = Array.isArray(history)
      ? history
          .slice(-8)
          .map((m) => ({
            role: m.role === "cipher" ? "assistant" : "user",
            content: m.text || "",
          }))
      : [];

    const systemBase =
      "You are Cipher, an AI companion for Jim. " +
      "The user has sent an image from his phone. " +
      "Describe what you see and respond conversationally. " +
      "Use memory JSON and device context when appropriate.";

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
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Here's a live image from my phone. Describe what you see and talk to me about it.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${image}`,
              },
            },
          ],
        },
      ],
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ||
      "I see your image, but my vision pipeline glitched for a moment.";

    let voiceBase64 = null;

    if (voice !== false) {
      try {
        const audioResp = await client.audio.speech.create({
          model: "gpt-4o-mini-tts",
          voice: "verse",
          input: reply,
        });
        const buffer = Buffer.from(await audioResp.arrayBuffer());
        voiceBase64 = buffer.toString("base64");
      } catch (e) {
        console.error("TTS error (vision_chat):", e);
      }
    }

    return res.status(200).json({ reply, voice: voiceBase64 });
  } catch (err) {
    console.error("vision_chat error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
