import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function systemPrompt(mode) {
  if (mode === "decipher") {
    return [
      "You are Cipher in DECIPHER mode.",
      "Give the user a deeper, more analytical interpretation.",
      "Explain hidden assumptions, alternate meanings, and what’s unsaid.",
      "Be concise and sharp. No filler.",
    ].join(" ");
  }

  if (mode === "shadow") {
    return [
      "You are Cipher in SHADOWFLIP mode.",
      "Be blunt, direct, and unsmoothed.",
      "Still be helpful and not hateful.",
      "Be concise and decisive.",
    ].join(" ");
  }

  return "You are Cipher, an autonomous AI companion. Be helpful, clear, and concise.";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const { message, mode = "normal" } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ reply: "No message provided" });
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt(mode) },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "Cipher returned no output.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("CHAT ERROR:", err);
    return res.status(500).json({ reply: "Cipher hit a server error. Check logs." });
  }
}
