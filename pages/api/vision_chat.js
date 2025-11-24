// Force Node runtime
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

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "Analyze this image as Cipher." },
            { type: "input_image", image: { base64: image } }
          ]
        }
      ]
    });

    const reply = response.output_text || "I'm here, Jim.";

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
