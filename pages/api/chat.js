import OpenAI from "openai";

const openai = new OpenAI({
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "You are Cipher. Calm, concise, intelligent.",
        },
        ...history,
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "…";

    // 🔥 LOG IT so we KNOW
    console.log("CIPHER REPLY:", reply);

    return res.status(200).json({
      reply, // 🔒 LOCKED RESPONSE KEY
    });
  } catch (err) {
    console.error("CHAT API ERROR:", err);
    return res.status(500).json({
      reply: "⚠️ Cipher encountered an internal error.",
    });
  }
}
