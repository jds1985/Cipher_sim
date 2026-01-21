// pages/api/chat.js
import { runCipherCore } from "../../cipher_core/core";
import { loadMemory, saveMemory } from "../../cipher_core/memory";

export default async function handler(req, res) {
  // Never cache
  res.setHeader("Cache-Control", "no-store");

  // Always respond JSON (even on errors)
  const replyOut = (text) => res.status(200).json({ reply: String(text || "…") });

  try {
    if (req.method !== "POST") return replyOut("Method not allowed.");
    if (!process.env.OPENAI_API_KEY) return replyOut("Missing API key.");

    const body = req.body || {};
    const message = typeof body.message === "string" ? body.message : "";
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message.trim()) return replyOut("Say something.");

    // TEMP single-user anchor
    const userId = "jim";

    // ---- Short-term UI history (sanitized) ----
    const HISTORY_LIMIT = 12;
    const trimmedHistory = history.slice(-HISTORY_LIMIT).map((m) => ({
      role: m.role === "decipher" ? "assistant" : m.role,
      content: String(m.content || ""),
    }));

    // ---- Long-term memory (fail-open) ----
    let longTerm = [];
    try {
      const memory = await loadMemory(userId);
      longTerm = Array.isArray(memory?.history) ? memory.history : [];
    } catch (e) {
      console.warn("⚠️ Memory load failed (fail-open):", e);
      longTerm = [];
    }

    // Merge memory for core prompt (bounded)
    const mergedHistory = [...longTerm, ...trimmedHistory].slice(-50);

    // ---- Build system prompt (fail-open) ----
    let systemPrompt = "You are Cipher.";
    try {
      systemPrompt = await runCipherCore(
        { history: mergedHistory },
        { userMessage: message }
      );
    } catch (err) {
      console.error("CORE FAILED (fail-open):", err);
      systemPrompt = "You are Cipher. Respond normally.";
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...trimmedHistory,
      { role: "user", content: message },
    ];

    // ---- OpenAI call with timeout ----
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    let response;
    try {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
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
      });
    } finally {
      clearTimeout(timeout);
    }

    let data = null;
    try {
      data = await response.json();
    } catch (e) {
      console.error("OPENAI JSON PARSE FAILED:", e);
      return replyOut("Upstream error. Try again.");
    }

    if (!response.ok) {
      console.error("OPENAI ERROR:", response.status, data);
      const msg = data?.error?.message || "OpenAI error.";
      return replyOut(msg);
    }

    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "…";

    // ---- Save memory (fail-open) ----
    try {
      await saveMemory(userId, {
        type: "interaction",
        role: "user",
        content: message,
        importance: "medium",
      });

      await saveMemory(userId, {
        type: "interaction",
        role: "assistant",
        content: reply,
        importance: "medium",
      });
    } catch (e) {
      console.warn("⚠️ Memory save failed (fail-open):", e);
    }

    return replyOut(reply);
  } catch (err) {
    console.error("CHAT API HARD CRASH:", err);

    if (err?.name === "AbortError") {
      return replyOut("That took too long. Try again.");
    }

    return replyOut("Cipher slipped for a second. Try again.");
  }
}
