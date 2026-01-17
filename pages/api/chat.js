// pages/api/chat.js
import { runCipherCore } from "../../cipher_core/core";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed." });
  }

  res.setHeader("Cache-Control", "no-store");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 25000);

  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      clearTimeout(timeoutId);
      return res.status(200).json({
        reply: "Say something real and try again.",
      });
    }

    const HISTORY_LIMIT = 12;
    const trimmedHistory = history.slice(-HISTORY_LIMIT);

    const systemPrompt = await runCipherCore(
      { history: trimmedHistory },
      { userMessage: message }
    );

    const messages = [
      { role: "system", content: systemPrompt },
      ...trimmedHistory,
      { role: "user", content: message },
    ];

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4.0-mini",
          messages,
          temperature: 0.6,
        }),
        signal: controller.signal,
      }
    );

    const data = await response.json();
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error("OPENAI ERROR:", data);
      return res.status(200).json({
        reply: "I hit a snag thinking that through. Try again.",
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "…";

    return res.status(200).json({ reply });
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      return res.status(200).json({
        reply: "That took a little too long. Try again.",
      });
    }

    console.error("CIPHER API CRASH:", err);
    return res.status(200).json({
      reply: "Cipher slipped for a second. Try again.",
    });
  }
}
