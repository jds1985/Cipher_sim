// pages/api/chat.js
// Cipher 7.3 — Deep Mode + Memory Pack + Human-Paced Verse Voice

import OpenAI from "openai";
import { runDeepMode } from "../../cipher_core/deepMode";
import { saveMemory } from "../../cipher_core/memory";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Human pacing helper
function humanizeSpeech(text) {
  return `
<speak>
  <prosody rate="92%">
    <break time="250ms"/>
    ${text
      .replace(/\./g, ".<break time='220ms'/>")
      .replace(/,/g, ",<break time='140ms'/>")
      .replace(/…/g, "<break time='280ms'/>")}
  </prosody>
</speak>
`;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { message, userId = "jim_default" } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Invalid message" });
    }

    // 1. Run Deep Mode
    const deepResult = await runDeepMode(message);
    const finalText = deepResult.answer || "I couldn’t form a response.";

    // 2. Save memory
    try {
      await saveMemory({
        userId,
        userMessage: message,
        cipherReply: finalText,
        meta: {
          source: "cipher_app",
          mode: "deep_mode",
          timestamp: Date.now(),
        },
      });
    } catch (err) {
      console.error("MEMORY SAVE ERROR:", err);
    }

    // 3. Generate Voice (human-paced)
    const tts = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: humanizeSpeech(finalText),
      format: "mp3",
    });

    const audioBase64 = Buffer.from(await tts.arrayBuffer()).toString("base64");

    // 4. Return to UI
    return res.status(200).json({
      ok: true,
      reply: finalText,
      voice: audioBase64,
      memoryHits: deepResult.memoryHits,
      soulHits: deepResult.soulHits,
    });
  } catch (err) {
    console.error("CHAT API ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Cipher internal chat error.",
      details: String(err),
    });
  }
}
