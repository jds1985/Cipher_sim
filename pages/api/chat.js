import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: "You are Cipher. Calm, concise, intelligent.",
        },
        ...history,
        {
          role: "user",
          content: message,
        },
      ],
    });

    const reply =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "…";

    return res.status(200).json({ message: reply });
  } catch (err) {
    console.error("CIPHER API ERROR:", err);
    return res.status(500).json({ error: "Cipher failed to respond" });
  }
}
