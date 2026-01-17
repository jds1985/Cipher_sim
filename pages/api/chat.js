// pages/api/chat.js
import { runCipherCore } from "../../cipher_core/core";
import { loadMemory, saveMemory } from "../../cipher_core/memory";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(200).json({ reply: "Method not allowed." });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({
        reply: "Server misconfigured: missing API key.",
      });
    }

    const { message, history = [] } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(200).json({ reply: "Say something real." });
    }

    // 🔐 TEMP SINGLE USER
    const userId = "jim";

    // 🧠 LOAD LONG-TERM MEMORY
    const memoryData = await loadMemory(userId);
    const longTermHistory = Array.isArray(memoryData.history)
      ? memoryData.history
      : [];

    // 🔒 SHORT-TERM CONTEXT (UI HISTORY)
    const trimmedHistory = Array.isArray(history)
      ? history.slice(-12).map((m) => ({
          role: m.role === "decipher" ? "assistant" : m.role,
          content: String(m.content || ""),
        }))
      : [];

    // 🧠 MERGE MEMORY FOR CORE
    const mergedHistory = [
      ...longTermHistory,
      ...trimmedHistory,
    ].slice(-50);

    // 🧠 SYSTEM PROMPT
    let systemPrompt;
    try {
      systemPrompt = await runCipherCore(
        { history: mergedHistory },
        { userMessage: message }
      );
    } catch (err) {
      console.error("CORE FAILED:", err);
      systemPrompt = "You are Cipher. Respond normally.";
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...trimmedHistory,
      { role: "user", content: message },
    ];

    // 🔮 OPENAI CALL
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.6,
        }),
      }
    );

    let data;
    try {
      data = await response.json();
    } catch {
      return res.status(200).json({
        reply: "Upstream error. Try again.",
      });
    }

    if (!response.ok) {
      console.error("OPENAI ERROR:", data);
      return res.status(200).json({
        reply: data?.error?.message || "OpenAI error.",
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content?.trim() || "…";

    // 💾 SAVE MEMORY — CORRECT SHAPE
    await saveMemory(userId, {
      type: "interaction",
      role: "assistant",
      content: reply,
      importance: "medium",
    });

    await saveMemory(userId, {
      type: "interaction",
      role: "user",
      content: message,
      importance: "medium",
    });

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("API CRASH:", err);
    return res.status(200).json({
      reply: "Cipher caught itself. Try again.",
    });
  }
}
