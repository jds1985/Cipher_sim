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
      return res.status(400).json({ error: "No message provided" });
    }

    // Convert chat history into plain text context
    const context = history
      .map((m) => `${m.role === "user" ? "User" : "Cipher"}: ${m.content}`)
      .join("\n");

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: `${context}\nUser: ${message}\nCipher:`,
    });

    const reply =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "…";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("CHAT API ERROR:", error);
    return res.status(500).json({
      reply: "⚠️ Cipher failed to respond.",
    });
  }
}
