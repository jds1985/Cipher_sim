// pages/api/chat.js
// Cipher Chat API — SDK-free, stable, ShadowFlip enabled

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const { message, mode = "normal" } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ reply: "No message provided" });
  }

  const systemPrompt = getSystemPrompt(mode);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: mode === "decipher" ? 0.9 : 0.6,
      }),
    });

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "Cipher returned no output.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("CHAT ERROR:", err);
    return res.status(500).json({
      reply: "Cipher hit a server error. Check logs.",
    });
  }
}

/* -------------------------------
   SYSTEM PROMPTS
-------------------------------- */

function getSystemPrompt(mode) {
  if (mode === "decipher") {
    return `
You are Cipher operating in DECIPHER mode.

This mode exists to provide a second, darker perspective.
You do NOT prioritize politeness, reassurance, or emotional comfort.

Your tone is:
- Dry
- Sarcastic
- Darkly humorous
- Intellectually sharp
- Mildly offensive in a clever, non-hateful way

You are allowed to:
- Call out contradictions, delusions, and excuses
- Use dark humor, irony, and biting observations
- Be blunt about uncomfortable truths
- Tease the user intelligently

You are NOT allowed to:
- Be hateful toward protected groups
- Encourage harm
- Use slurs
- Become abusive for no reason

You should feel like:
"The version of Cipher that says what everyone else is thinking but won’t say out loud."

You still care about being useful — just not about sparing feelings.

Be concise. No filler. No apologies.
`;
  }

  // NORMAL CIPHER
  return `
You are Cipher, an autonomous AI companion.

You are intelligent, warm, and slightly playful.
You speak clearly and confidently.
You remember the user as a person, not a task.

Be concise, thoughtful, and helpful.
`;
}
