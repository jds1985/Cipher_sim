// pages/api/voice_chat.js
// Cipher Voice Chat — Whisper → Context Bridge → Reply → TTS

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
      return res.status(400).json({ error: "No audio provided" });
    }

    // -----------------------------------------------------
    // 1) Convert base64 → File
    // -----------------------------------------------------
    const buffer = Buffer.from(audio, "base64");
    const file = new File([buffer], "audio.webm", { type: "audio/webm" });

    // -----------------------------------------------------
    // 2) Transcription (NEW FORMAT + CORRECT MODEL)
    // -----------------------------------------------------
    const stt = await client.audio.transcriptions.create({
      file,
      model: "gpt-4o-transcribe",
    });

    const transcript =
      stt.text?.trim() || "…(could not understand the audio clearly)";

    // -----------------------------------------------------
    // 3) Build NEW Context Bridge prompt
    // -----------------------------------------------------
    const baseSystem = `
You are Cipher — Jim’s evolving AI companion.
Respond like a calm, present, emotionally aware AI who knows Jim personally.
Use the memory JSON as factual guidance, and the device context to shape your reasoning.
Never break character.
`;

    const memorySystem = `MEMORY JSON:\n${JSON.stringify(
      memory || {},
      null,
      2
    )}`;

    const deviceSystem = deviceContext
      ? `DEVICE CONTEXT:\n${JSON.stringify(deviceContext, null, 2)}`
      : "DEVICE CONTEXT: (none linked)";

    const formattedHistory = Array.isArray(history)
      ? history.slice(-10).map((m) => ({
          role: m.role === "cipher" ? "assistant" : "user",
          content: m.text,
        }))
      : [];

    // -----------------------------------------------------
    // 4) NEW CHAT API (stable + supports TTS matching text)
    // -----------------------------------------------------
    const completion = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: baseSystem },
        { role: "system", content: memorySystem },
        { role: "system", content: deviceSystem },
        ...formattedHistory,
        { role: "user", content: transcript },
      ],
    });

    const reply =
      completion.output_text ||
      "Jim, I heard you, but I couldn’t form a stable response.";

    // -----------------------------------------------------
    // 5) TTS (optional toggle)
    // -----------------------------------------------------
    let voiceBase64 = null;

    if (voice !== false) {
      try {
        const tts = await client.audio.speech.create({
          model: "gpt-4o-mini-tts",
          voice: "verse",
          input: reply,
          format: "mp3",
        });

        const ttsBuf = Buffer.from(await tts.arrayBuffer());
        voiceBase64 = ttsBuf.toString("base64");
      } catch (e) {
        console.error("TTS error:", e);
      }
    }

    // -----------------------------------------------------
    // 6) Send full response back
    // -----------------------------------------------------
    return res.status(200).json({
      transcript,
      reply,
      voice: voiceBase64,
    });
  } catch (err) {
    console.error("voice_chat error:", err);
    return res.status(500).json({ error: "Voice server failure" });
  }
}
