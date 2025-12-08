// pages/api/vision_chat.js
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
    const { base64Image, userId } = req.body;

    if (!base64Image) {
      return res.status(400).json({ error: "No image provided" });
    }

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    // Load memory
    const memory = await loadMemory(userId);

    // Build Cipher System Prompt
    const systemPrompt = await runCipherCore(memory);

    // ---- GPT-4o VISION CALL (REQUIRED) ----
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: "Analyze this image and explain it." },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${base64Image}`,
            },
          ],
        },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "I could not analyze the image.";

    // Save vision memory
    await saveMemory(userId, "[Image Uploaded]", reply);

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Vision error:", err);
    return res.status(500).json({ error: "Vision pipeline failed." });
  }
}
