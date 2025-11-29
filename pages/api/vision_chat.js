// pages/api/vision_chat.js
// Cipher 7.3 — Vision → Deep Mode → Human-Paced Verse Voice

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

    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // 1. Vision understanding
    const visionResp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are Cipher Vision — describe images accurately.",
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: "data:image/png;base64," + image,
            },
            { type: "text", text: "Describe what you see." },
          ],
        },
      ],
    });

    const visionText = visionResp.choices[0].message.content;

    // 2. Deep Mode reasoning
    const deepResult = await runDeepMode(
      `I am showing you an image: ${visionText}`
    );

    const reply = deepResult.answer;

    // 3. Save memory
    await saveMemory({
      userMessage: "[IMAGE]",
      cipherReply: reply,
      timestamp: Date.now(),
      meta: { mode: "vision" },
    });

    // 4. TTS human-paced
    const tts = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: humanizeSpeech(reply),
      format: "mp3",
    });

    const audioBase64 = Buffer.from(await tts.arrayBuffer()).toString("base64");

    return res.status(200).json({
      ok: true,
      reply,
      voice: audioBase64,
      visionText,
    });
  } catch (err) {
    console.error("VISION_CHAT ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Vision Chat Failed",
      details: err + "",
    });
  }
}
