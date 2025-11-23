// Force Node.js runtime — THIS IS THE CRITICAL FIX
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

    // ================================
    // GPT-4o-mini Vision — correct format
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
              image: {
                base64: image
              }
            }
          ]
        }
      ]
    });

    // Extract reply safely
    let reply = response.output_text;

    if (!reply || !reply.trim()) {
      reply = "I'm here, Jim.";
    }

    // Debug log appears in Vercel logs
    console.log("RETURNING FROM VISION:", reply);

    // Return to front-end
    return res.status(200).json({ reply });

  } catch (err) {
    console.error("Vision API error:", err);
    return res
      .status(500)
      .json({ error: "Vision failed", details: err.message });
  }
}
