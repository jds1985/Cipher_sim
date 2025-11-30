// pages/api/voice_chat.js
// Cipher voice chat – transcribe → chat → optional TTS

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { audio, memory, history, deviceContext, voice } = req.body;

    if (!audio) {
      return res.status(400).json({ error: "No audio" });
    }

    const audioBuffer = Buffer.from(audio, "base64");

    // 1) Transcribe
    const transcription = await client.audio.transcriptions.create({
      file: {
        data: audioBuffer,
        filename: "input.webm",
      },
      model: "gpt-4o-mini-transcribe",
    });

    const transcript =
      transcription.text?.trim() || "…(no clear transcript captured)";

    // 2) Run through same chat logic as text chat
    const historyMessages = Array.isArray(history)
      ? history
          .slice(-10)
          .map((m) => ({
            role: m.role === "cipher" ? "assistant" : "user",
            content: m.text || "",
          }))
      : [];

    const systemBase =
      "You are Cipher, an AI companion for Jim. Respond naturally to his spoken questions. " +
      "Use the provided memory JSON as facts about Jim, and device context when present.";

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
        { role: "user", content: transcript },
      ],
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ||
      "I heard you, Jim, but something glitched on my side.";

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
        console.error("TTS error (voice_chat):", e);
      }
    }

    return res
      .status(200)
      .json({ transcript, reply, voice: voiceBase64 });
  } catch (err) {
    console.error("voice_chat error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
