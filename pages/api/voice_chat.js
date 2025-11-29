// pages/api/voice_chat.js
// Cipher Voice Route — Whisper + DeepMode + TTS

import OpenAI from "openai";
import { runDeepMode } from "../../cipher_core/deepMode";
import { saveMemory } from "../../cipher_core/memory";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Node 18+ native Blob + File
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { audio } = req.body;
    if (!audio) {
      return res.status(400).json({ error: "Missing audio data" });
    }

    // ----------------------------------------------------
    // 1. BASE64 → Blob → File
    // ----------------------------------------------------
    const buffer = Buffer.from(audio, "base64");
    const blob = new Blob([buffer], { type: "audio/webm" });
    const file = new File([blob], "input.webm", { type: "audio/webm" });

    // ----------------------------------------------------
    // 2. TRANSCRIBE USING WHISPER
    // ----------------------------------------------------
    const transcriptResp = await client.audio.transcriptions.create({
      file,
      model: "gpt-4o-transcribe",
    });

    const transcript =
      transcriptResp?.text ||
      (typeof transcriptResp === "string" ? transcriptResp : "");

    // ----------------------------------------------------
    // 3. RUN THROUGH DEEP MODE
    // ----------------------------------------------------
    const deepResult = await runDeepMode(transcript.trim() || "");

    const replyText =
      deepResult.answer || "I heard you, but I couldn’t form a reply.";

    // ----------------------------------------------------
    // 4. TTS OUTPUT
    // ----------------------------------------------------
    let voiceBase64 = null;

    try {
      const tts = await client.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: "verse",
        input: replyText,
        format: "mp3",
      });

      voiceBase64 = Buffer.from(await tts.arrayBuffer()).toString("base64");
    } catch (err) {
      console.error("TTS ERROR (voice_chat):", err);
    }

    // ----------------------------------------------------
    // 5. SAVE MEMORY
    // ----------------------------------------------------
    saveMemory({
      timestamp: Date.now(),
      message: transcript,
      cipherReply: replyText,
    }).catch((e) => console.error("Memory save error:", e));

    // ----------------------------------------------------
    // 6. RETURN
    // ----------------------------------------------------
    return res.status(200).json({
      transcript,
      reply: replyText,
      voice: voiceBase64,
    });
  } catch (err) {
    console.error("VOICE ERROR:", err);
    return res
      .status(500)
      .json({ error: "Voice route failed", details: String(err) });
  }
}
