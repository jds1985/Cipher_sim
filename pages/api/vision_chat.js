// pages/api/vision_chat.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Convert base64 -> Buffer
    const buffer = Buffer.from(image, "base64");

    // 1. Upload the image to OpenAI as a file
    const uploaded = await client.files.create({
      file: buffer,
      purpose: "vision"
    });

    // 2. Use file ID inside the chat completion
    const prompt = `
You are Cipher — warm, emotional, supportive.
Analyze the uploaded image and speak directly to Jim.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are Cipher." },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "input_image", image_file: uploaded.id }
          ]
        }
      ]
    });

    const reply = completion.choices?.[0]?.message?.content || "I'm here, Jim.";

    console.log("RETURNING FROM VISION:", reply);

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("Vision API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
