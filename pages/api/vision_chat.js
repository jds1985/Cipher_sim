// pages/api/vision_chat.js
// Cipher Vision V2 — Image Understanding + Visual Memory Branches

import OpenAI from "openai";
import { db } from "../../firebaseAdmin";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// -------------------------------------------------------------
// SAVE VISUAL MEMORY INTO FIRESTORE
// -------------------------------------------------------------
async function saveVisualMemory(userId, analysis, base64Image) {
  try {
    const newMemory = {
      userId,
      type: "visual_memory",
      analysis,
      imagePreview: base64Image.slice(0, 200) + "...", // avoids huge payloads
      timestamp: Date.now(),
    };

    await db.collection("cipher_branches").add(newMemory);
  } catch (err) {
    console.error("Failed to store visual memory:", err);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { base64Image, memory, userId } = req.body;

    if (!base64Image) {
      return res.status(400).json({ error: "No image provided" });
    }

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "Missing userId for memory tracking." });
    }

    // MAIN GPT-4o VISION CALL
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are CIPHER, an advanced visual reasoning AI.
When you see an image:
- Describe it clearly.
- Identify relevant emotional tone.
- Identify important details for long-term learning.
- Suggest why this image may matter to Jim.
- Be concise but meaningful.
          `,
        },
        {
          role: "user",
          content: [
            { type: "text", text: memory ? `Use this memory context: ${memory}` : "Analyze this image." },
            {
              type: "image_url",
              image_url: `data:image/jpeg;base64,${base64Image}`,
            },
          ],
        },
      ],
    });

    const analysis = response.choices?.[0]?.message?.content || "I couldn't analyze the image.";

    // SAVE VISUAL MEMORY
    await saveVisualMemory(userId, analysis, base64Image);

    return res.status(200).json({ reply: analysis });
  } catch (err) {
    console.error("Vision API Error:", err);
    return res.status(500).json({ error: "Vision processing error" });
  }
}
