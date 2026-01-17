// pages/api/chat.js
import { runCipherCore } from "../../cipher_core/core";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed." });
  }

  // never cache
  res.setHeader("Cache-Control", "no-store");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    // 🔑 ENV CHECK
    if (!process.env.OPENAI_API_KEY) {
      clearTimeout(timeoutId);
      return res.status(200).json({
        reply:
          "Server misconfigured: OPENAI_API_KEY is missing. Add it and redeploy.",
      });
    }

    const { message, history = [] } = req.body ?? {};

    if (!message || typeof message !== "string") {
      clearTimeout(timeoutId);
      return res.status(200).json({
        reply: "Say something real and try again.",
      });
    }

    // 🔒 HARD LIMIT + 🔥 ROLE SANITIZATION
    const HISTORY_LIMIT = 12;
    const trimmedHistory = Array.isArray(history)
      ? history.slice(-HISTORY_LIMIT).map((msg) => ({
          role: msg.role === "decipher" ? "assistant" : msg.role,
          content: msg.content,
        }))
      : [];

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

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.6,
        }),
        signal: controller.signal,
      }
    );

    const data = await response.json().catch(() => null);
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error("OPENAI ERROR STATUS:", response.status);
      console.error("OPENAI ERROR BODY:", data);

      const msg =
        data?.error?.message ||
        data?.message ||
        "Unknown OpenAI error.";

      return res.status(200).json({
        reply: `OpenAI error (${response.status}). ${msg}`,
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content?.trim() || "…";

    return res.status(200).json({ reply });
  } catch (err) {
    clearTimeout(timeoutId);

    if (err?.name === "AbortError") {
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
