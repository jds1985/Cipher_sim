// pages/api/chat.js
import { runCipherCore } from "../../cipher_core/core";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // never cache
  res.setHeader("Cache-Control", "no-store");

  let responded = false;

  // hard backend timeout
  const timeout = setTimeout(() => {
    if (responded) return;
    responded = true;
    try {
      res.status(504).json({ error: "Cipher timeout" });
    } catch {}
  }, 25000);

  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      clearTimeout(timeout);
      responded = true;
      return res.status(400).json({ error: "Missing message" });
    }

    // 🔒 HARD LIMIT history
    const HISTORY_LIMIT = 12;
    const trimmedHistory = history.slice(-HISTORY_LIMIT);

    // 🧠 Build system prompt
    const systemPrompt = await runCipherCore(
      { history: trimmedHistory },
      { userMessage: message }
    );

    const messages = [
      { role: "system", content: systemPrompt },
      ...trimmedHistory,
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages,
        temperature: 0.6,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OPENAI ERROR:", data);
      clearTimeout(timeout);
      responded = true;
      return res.status(500).json({ error: "OpenAI error" });
    }

    const reply =
      data?.choices?.[0]?.message?.content?.trim() || "…";

    clearTimeout(timeout);
    responded = true;
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("CIPHER API CRASH:", err);
    clearTimeout(timeout);
    if (!responded) {
      responded = true;
      return res.status(500).json({ error: "Cipher failed to respond" });
    }
  }
}
