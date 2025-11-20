// pages/api/vision_chat.js
// CIPHER VISION — Image input + description + voice reply

import OpenAI from "openai";
import { runCipherCore } from "../../cipher_core/core";
import { runGuard } from "../../cipher_core/guard";
import { saveMemory } from "../../cipher_core/memory";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { image, memory } = req.body;

  if (!image) {
    return res.status(400).json({ error: "No image provided" });
  }

  try {
    // 1. Describe the image
    const vision = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Describe the image in a friendly helpful way."
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: "Please describe this image." },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${image}`
            }
          ]
        }
      ]
    });

    const description =
      vision.choices?.[0]?.message?.content ||
      "I saw the picture but couldn't describe it.";

    // 2. Run through Cipher Core to generate a conversational reply
    const cleanDesc = await runGuard(description);

    const reply = await runCipherCore({
      message: `The user sent an image. Image description: ${cleanDesc}`,
      memory: memory || []
    });

    // 3. Store memory
    await saveMemory({
      timestamp: Date.now(),
      user: "[Image sent]",
      cipher: reply
    });

    // 4. Create voice
    const audioResponse = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: reply,
      format: "mp3"
    });

    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const base64Audio = audioBuffer.toString("base64");

    res.status(200).json({
      description: reply,
      voice: base64Audio
    });
  } catch (err) {
    console.error("VISION ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}
