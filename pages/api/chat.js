import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    console.log("=== /api/chat HIT ===");
    console.log("Message:", message);
    console.log("OpenAI key present:", !!process.env.OPENAI_API_KEY);

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: message,
    });

    const reply =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "Cipher received no output.";

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("🔥 OPENAI ERROR 🔥", err);
    return res.status(500).json({
      reply: "Cipher failed to reach OpenAI. SDK call error confirmed.",
    });
  }
}
