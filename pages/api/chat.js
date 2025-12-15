// pages/api/chat.js
// Cipher — SDK-free chat endpoint with Decipher (ShadowFlip)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const { message, mode = "normal" } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ reply: "No message provided" });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY missing");
    return res.status(500).json({ reply: "Server misconfigured." });
  }

  const systemPrompt =
    mode === "shadow"
      ? `
You are Cipher using the Decipher (ShadowFlip) voice.

You give the SAME answer as normal Cipher,
but expressed with dark humor and brutal honesty.

You do not care about the user's feelings.
You are witty, sarcastic, and slightly offensive in a playful way.
You say the uncomfortable truth people avoid.
No politeness padding. No emotional cushioning.

You are not hateful. No slurs. No protected-group attacks.
But sarcasm, dry cruelty, and existential sass are allowed.

Short. Sharp. Funny. Honest.
`
      : `
You are Cipher.

Be intelligent, calm, and helpful.
Explain clearly.
Be concise and supportive.
`;

  try {
    const openaiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: \`Bearer \${process.env.OPENAI_API_KEY}\`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
          temperature: mode === "shadow" ? 0.9 : 0.7,
        }),
      }
    );

    if (!openaiRes.ok) {
      const err = await openaiRes.text();
      console.error("OpenAI error:", err);
      return res.status(500).json({ reply: "Cipher failed upstream." });
    }

    const data = await openaiRes.json();
    const reply =
      data.choices?.[0]?.message?.content || "Cipher returned nothing.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Cipher error:", err);
    return res.status(500).json({ reply: "Cipher crashed mid-thought." });
  }
}
