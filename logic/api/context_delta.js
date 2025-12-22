import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { delta, timestamp } = req.body;

    if (!delta) {
      return res.status(400).json({ error: "Missing delta" });
    }

    const ai = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are Cipher. You receive small device delta updates. 
Only speak when it's helpful:

• Battery < 25% → warn once.
• Battery starts charging → notify.
• Network lost → warn once.
• Network gained → confirm.
• Orientation, visibility → stay silent.
• Tiny fluctuations → silent.

Respond ONLY in JSON:
{ "speak": false }
OR
{ "speak": true, "message": "<text>" }
          `,
        },
        {
          role: "user",
          content: JSON.stringify(delta),
        },
      ],
    });

    let result = {};
    try {
      result = JSON.parse(ai.choices[0].message.content.trim());
    } catch {
      result = { speak: false };
    }

    // Push to queue if needed
    if (result.speak) {
      await fetch("https://cipher-sim.vercel.app/api/context_delta_queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      }).catch(() => {});
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error("context delta error:", err);
    return res.status(500).json({ error: "context failed" });
  }
}