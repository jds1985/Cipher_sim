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

    // ---------------------------
    // CALL GPT-4o-mini VISION
    ---------------------------
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "You are Cipher Vision. Analyze images deeply and describe details." },
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: {
                url: image
              }
            },
            {
              type: "text",
              text: "Describe what you see and remember anything meaningful."
            }
          ]
        }
      ]
    });

    return res.status(200).json({
      reply: response.choices[0].message.content
    });

  } catch (err) {
    console.error("Vision Error:", err);
    return res.status(500).json({ error: "Vision processing failed." });
  }
}
