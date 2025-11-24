export const config = {
  runtime: "nodejs"
};

const OpenAI = require("openai").default;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are Cipher — warm, emotionally intelligent, supportive."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this image as Cipher." },
            { type: "image_url", image_url: `data:image/jpeg;base64,${image}` }
          ]
        }
      ]
    });

    const reply = response.choices?.[0]?.message?.content || "I'm here, Jim.";

    console.log("VISION REPLY:", reply);

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("Vision API error:", err);
    return res.status(500).json({ error: "Vision failed", details: err.message });
  }
};
