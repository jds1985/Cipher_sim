// pages/api/chat.js
// Cipher — SDK-FREE Chat Endpoint (Vercel Safe)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const { message, mode = "normal" } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ reply: "No message provided" });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY missing");
    return res.status(500).json({ reply: "OpenAI key missing on server." });
  }

  const systemPrompt = (() => {
    if (mode === "decipher") {
      return [
        "You are Cipher in DECIPHER mode.",
        "Provide deeper analysis.",
        "Reveal hidden assumptions and implications.",
        "Be concise, sharp, and analytical.",
      ].join(" ");
    }

    if (mode === "shadow") {
      return [
        "You are Cipher in SHADOWFLIP mode.",
        "Be blunt and direct.",
        "Remove politeness padding.",
        "Still be helpful, not hateful.",
      ].join(" ");
    }

    return "You are Cipher, an autonomous AI companion. Be helpful, clear, and concise.";
  })();

  try {
    console.log("🧠 Cipher chat request:", { mode, message });

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
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
        temperature: 0.7,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("🔥 OpenAI HTTP error:", openaiRes.status, errText);
      return res.status(500).json({ reply: "Cipher failed to reach OpenAI." });
    }

    const data = await openaiRes.json();
    const reply =
      data.choices?.[0]?.message?.content ??
      "Cipher returned no response.";

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("💥 Cipher server error:", err);
    return res.status(500).json({ reply: "Cipher hit a server error. Check logs." });
  }
}
