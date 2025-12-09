import { put } from "@vercel/blob";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Allow large body for blob conversion
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { base64Image, userId } = req.body;

    if (!base64Image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Convert base64 → binary
    const imgBuffer = Buffer.from(base64Image, "base64");

    // Upload to Vercel Blob (VERY tiny payload)
    const blob = await put(`vision-${Date.now()}.jpg`, imgBuffer, {
      contentType: "image/jpeg",
      access: "public",
    });

    const imgUrl = blob.url;

    // Vision call
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "You are Cipher Vision. Analyze deeply." },
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: { url: imgUrl }
            },
            {
              type: "text",
              text: "Describe what you see in detail and remember anything meaningful."
            }
          ]
        }
      ]
    });

    return res.status(200).json({
      reply: completion.choices[0].message.content,
      imgUrl,
    });

  } catch (err) {
    console.error("VISION ERROR:", err);
    return res.status(500).json({
      error: "Vision failed",
      details: err.message,
    });
  }
}
