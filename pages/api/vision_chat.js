// pages/api/vision_chat.js
// Cipher Vision V2 — Image Understanding + Memory

import OpenAI from "openai";
import { loadMemory, saveMemory } from "../../cipher_core/memory";
import { runCipherCore } from "../../cipher_core/core";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { base64Image, memory, userId } = req.body;

    if (!base64Image) {
      return res.status(400).json({ error: "No image provided" });
    }

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    // Load Firerestore memory for this user
    const memoryContext = await loadMemory(userId);

    // Build the system prompt that includes memory + core traits
    const systemPrompt = await runCipherCore(memoryContext);

    // ----------------------------------------
    //  GPT-4o-mini Vision inference
    // ----------------------------------------
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Analyze this image in detail.",
            },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${base64Image}`,
            },
          ],
        },
      ],
    });

    const reply =
      response.choices?.[0]?.message?.content ||
      "I couldn't analyze the image.";

    // ----------------------------------------
    // Save image reflection as a memory branch
    // ----------------------------------------
    await saveMemory(userId, "[Image uploaded]", reply);

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Vision API error:", err);
    return res.status(500).json({ error: "Vision pipeline failed." });
  }
}
