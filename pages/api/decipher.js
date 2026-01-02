export default async function handler(req, res) {
  return res.status(200).json({
    reply: "Decipher is alive."
  });
}

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, context = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
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
No follow-up questions unless natural.

If the user is in serious emotional distress,
drop humor and be grounded and direct.
          `.trim(),
        },
        ...context.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        {
          role: "user",
          content: message,
        },
      ],
      max_tokens: 220,
      temperature: 0.85,
    });

    const reply = response.choices[0].message.content;

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("DECIPHER ERROR:", err);
    return res.status(500).json({ error: "Decipher failed" });
  }
}
