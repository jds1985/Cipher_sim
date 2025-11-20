// pages/api/vision_chat.js
// Cipher Vision — Image + Memory + Voice

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image, memory } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Send image to GPT-4o Vision
    const visionResult = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Cipher. Analyze the image and respond naturally but clearly.",
        },
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${image}`,
            },
          ],
        },
      ],
    });

    const reply =
      visionResult.choices?.[0]?.message?.content ||
      "I analyzed the image, but something seems off.";

    // Create voice output
    const audioResponse = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: reply,
      format: "mp3",
    });

    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    const base64Audio = audioBuffer.toString("base64");

    return res.status(200).json({
      reply,
      voice: base64Audio,
    });
  } catch (err) {
    console.error("Vision API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
