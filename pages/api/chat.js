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
    // 🔑 QUICK ENV CHECK (this alone catches 80% of “snag” loops)
    if (!process.env.OPENAI_API_KEY) {
      clearTimeout(timeoutId);
      return res.status(200).json({
        reply:
          "Server misconfigured: OPENAI_API_KEY is missing on Vercel. Add it and redeploy.",
      });
    }

    const { message, history = [] } = req.body ?? {};

    if (!message || typeof message !== "string") {
      clearTimeout(timeoutId);
      return res.status(200).json({ reply: "Say something real and try again." });
    }

    // 🔒 HARD LIMIT history
    const HISTORY_LIMIT = 12;
    const trimmedHistory = Array.isArray(history)
      ? history.slice(-HISTORY_LIMIT)
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

    // ✅ VALID MODEL (and configurable)
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
    });

    const data = await response.json().catch(() => null);
    clearTimeout(timeoutId);

    if (!response.ok) {
      // 🔥 Log full error server-side
      console.error("OPENAI ERROR STATUS:", response.status);
      console.error("OPENAI ERROR BODY:", data);

      // ✅ Return something YOU can see in the UI while debugging
      const msg =
        data?.error?.message ||
        data?.message ||
        "Unknown OpenAI error (no message).";

      return res.status(200).json({
        reply: `OpenAI error (${response.status}). ${msg}`,
      });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim() || "…";
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
