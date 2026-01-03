import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, context = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing message" });
    }

    const history = Array.isArray(context)
      ? context.map((m) => `${m.role}: ${m.content}`).join("\n")
      : "";

    const prompt = `
You are DECIPHER.

You are blunt, dry, darkly humorous, and honest.
You do NOT comfort.
You do NOT coddle.
You do NOT over-explain.

You speak like a sharp best friend who tells the truth
without cruelty.

No emojis.
No therapy language.
No AI disclaimers.

If the user is in serious emotional distress,
drop humor and be grounded and direct.

Conversation so far:
${history}

User:
${message}
    `.trim();

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      max_output_tokens: 220,
    });

    const reply =
      response.output_text || "Yeah. I’m not getting anything back.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("DECIPHER API ERROR:", err);
    return res.status(500).json({ error: "Decipher failed" });
  }
}
