// pages/api/voice_chat.js
// Cipher Voice Route — OpenAI v5 Stable Version

import OpenAI from "openai";
import { File } from "formdata-node";
import { runGuard } from "../../cipher_core/guard";
import { runCipherCore } from "../../cipher_core/core";
import { saveMemory } from "../../cipher_core/memory";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { audio, memory } = req.body;

    if (!audio) {
      return res.status(400).json({ error: "Missing audio data." });
    }

    // Convert base64 → File object
    const buffer = Buffer.from(audio, "base64");
    const file = new File([buffer], "audio.webm", { type: "audio/webm" });

    /* ------------------------------------------
       1) TRANSCRIBE (WHISPER v5)
    ------------------------------------------ */
    const transcriptResp = await client.audio.transcriptions.create({
      file,
      model: "gpt-4o-transcribe",
    });

    const transcript = transcriptResp.text?.trim() || "";

    /* ------------------------------------------
       2) GUARD + CORE REASONING
    ------------------------------------------ */
    const safeText =
      (await runGuard(transcript || "[empty voice input]")) || "No input.";

    const cipherReply =
      (await runCipherCore({
        message: safeText,
        memory: memory || {},
      })) || "I'm here, but I couldn't understand the audio.";

    /* ------------------------------------------
       3) SAVE MEMORY (prevent undefined fields)
    ------------------------------------------ */
    await saveMemory({
      timestamp: Date.now(),
      user: safeText,
      cipher: cipherReply ?? "",
    });

    /* ------------------------------------------
       4) TEXT → SPEECH
    ------------------------------------------ */
    const tts = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: cipherReply,
      format: "mp3",
    });

    const ttsBuffer = Buffer.from(await tts.arrayBuffer());
    const voiceBase64 = ttsBuffer.toString("base64");

    /* ------------------------------------------
       5) SEND BACK TO FRONTEND
    ------------------------------------------ */
    return res.status(200).json({
      transcript,
      reply: cipherReply,
      voice: voiceBase64,
    });
  } catch (err) {
    console.error("VOICE ERROR:", err);

    return res.status(500).json({
      error: "Voice route failed",
      details: err?.message || err,
    });
  }
}
