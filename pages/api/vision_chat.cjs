// ==============================
// FORCE NODE RUNTIME (CRITICAL)
// ==============================
export const config = {
  runtime: "nodejs",
  regions: ["iad1"], // prevents accidental edge routing
};

// ==============================
// Imports (CommonJS required)
// ==============================
const OpenAI = require("openai").default;

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ==============================
// API Route
// ==============================
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // ================================
    // GPT-4o Vision Request
    // ================================
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "You are Cipher — warm, emotionally intelligent, calm, and supportive. You analyze images with compassion and clarity."
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
              image: { base64: image }
            }
          ]
        }
      ]
    });

    // Extract Cipher's reply as plain text
    let reply = response.output_text;

    if (!reply || !reply.trim()) {
      reply = "I'm here, Jim.";
    }

    // Debug log (shows in Vercel)
    console.log("VISION REPLY:", reply);

    // Send to front-end
    return res.status(200).json({ reply });

  } catch (err) {
    console.error("Vision API error:", err);
    return res.status(500).json({
      error: "Vision failed",
      details: err.message,
    });
  }
};
