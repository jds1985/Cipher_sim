// pages/api/chat.js

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(200).json({ reply: "Method not allowed." });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({
        reply: "Server misconfigured: OPENAI_API_KEY missing.",
      });
    }

    const { message, history = [] } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(200).json({
        reply: "Say something.",
      });
    }

    // 🔒 HARD-SANITIZED CONTEXT (UI ONLY)
    const context = Array.isArray(history)
      ? history.slice(-12).map((m) => ({
          role: m.role === "decipher" ? "assistant" : m.role,
          content: String(m.content || ""),
        }))
      : [];

    const messages = [
      {
        role: "system",
        content: "You are Cipher. Speak naturally, calmly, and concisely.",
      },
      ...context,
      { role: "user", content: message },
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages,
          temperature: 0.6,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    const raw = await response.text();

    if (!raw || !raw.trim()) {
      throw new Error("Empty response from OpenAI");
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.error("RAW OPENAI RESPONSE:", raw);
      throw new Error("Malformed JSON from OpenAI");
    }

    if (!response.ok) {
      console.error("OPENAI ERROR:", data);
      return res.status(200).json({
        reply: data?.error?.message || "OpenAI error.",
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "…";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("PHASE 3 API ERROR:", err);

    return res.status(200).json({
      reply:
        err?.name === "AbortError"
          ? "That took too long. Try again."
          : `Transport error: ${err.message}`,
    });
  }
}
