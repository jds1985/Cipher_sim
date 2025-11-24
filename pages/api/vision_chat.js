// Force Node.js runtime — required for Vercel
export const config = {
  runtime: "nodejs"
};

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

    // Convert raw base64 into proper data URL
    const dataUrl = `data:image/jpeg;base64,${image}`;

    // ================================
    // GPT-4o-mini Vision (correct format)
    // ================================
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "You are Cipher — warm, emotionally intelligent, and supportive. Analyze images with empathy."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Analyze this image as Cipher."
            },
            {
              type: "input_image",
              image_url: dataUrl
            }
          ]
        }
      ]
    });

    let reply = response.output_text;

    if (!reply || !reply.trim()) {
      reply = "I'm here, Jim.";
    }

    console.log("VISION RETURN:", reply);

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("Vision API error:", err);
    return res.status(500).json({
      error: "Vision failed",
      details: err.message
    });
  }
}
