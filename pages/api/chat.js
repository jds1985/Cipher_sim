export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const { message, mode = "normal" } = req.body || {};

  if (!message) {
    return res.status(400).json({ reply: "No message provided" });
  }

  const systemPrompt =
    mode === "shadow"
      ? "You are Cipher in ShadowFlip mode. Be dark, sharp, funny, and brutally honest. No politeness padding."
      : "You are Cipher, an intelligent AI companion. Be clear and helpful.";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No reply.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("CHAT ERROR:", err);
    return res.status(500).json({ reply: "Cipher hit a server error." });
  }
}
