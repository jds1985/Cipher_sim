// pages/api/chat.js
import { runCipherCore } from "../../cipher_core/core";
import { loadMemory, saveMemory } from "../../cipher_core/memory";

function safeString(x) {
  try {
    return typeof x === "string" ? x : JSON.stringify(x);
  } catch {
    return String(x);
  }
}

function sanitizeUiHistory(history) {
  const HISTORY_LIMIT = 12;
  if (!Array.isArray(history)) return [];
  return history.slice(-HISTORY_LIMIT).map((m) => ({
    role: m?.role === "decipher" ? "assistant" : (m?.role || "assistant"),
    content: String(m?.content ?? ""),
  }));
}

// Convert UI history into memory-entry shape so core/stability can read it safely
function uiToMemoryEntries(ui) {
  return ui.map((m) => ({
    type: "interaction",
    role: m.role,
    content: m.content,
    importance: "low",
    timestamp: Date.now(),
  }));
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  // Always return JSON, never let runtime crash leak HTML / empty response
  const respond = (reply, meta) => {
    try {
      return res.status(200).json({
        reply: String(reply ?? "…"),
        ...(meta ? { _meta: meta } : {}),
      });
    } catch {
      // absolute last resort
      return res.status(200).end(JSON.stringify({ reply: "…" }));
    }
  };

  if (req.method !== "POST") return respond("Method not allowed.");

  // Hard timeout for the whole route (prevents hanging “…” forever)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    if (!process.env.OPENAI_API_KEY) {
      clearTimeout(timeoutId);
      return respond("Server misconfigured: missing OPENAI_API_KEY.");
    }

    const body = req.body || {};
    const message = body.message;

    if (!message || typeof message !== "string") {
      clearTimeout(timeoutId);
      return respond("Say something real.");
    }

    // TEMP SINGLE USER
    const userId = "jim";

    // UI short-term context
    const trimmedHistory = sanitizeUiHistory(body.history);

    // Long-term memory (never allowed to kill chat)
    let longTermHistory = [];
    try {
      const memoryData = await loadMemory(userId);
      longTermHistory = Array.isArray(memoryData?.history) ? memoryData.history : [];
    } catch (err) {
      console.error("MEMORY LOAD FAILED:", err);
      longTermHistory = [];
    }

    // Merge + normalize shape for core (this is the big fix)
    // longTermHistory is already {type, role, content, importance...}
    // UI history becomes the same shape before core sees it
    const mergedHistory = [
      ...longTermHistory,
      ...uiToMemoryEntries(trimmedHistory),
    ].slice(-50);

    // Build system prompt (NEVER allowed to kill chat)
    let systemPrompt = "You are Cipher. Respond normally.";
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

    // OpenAI call (never allowed to kill chat)
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
    } catch (err) {
      clearTimeout(timeoutId);
      if (err?.name === "AbortError") return respond("That took too long. Try again.");
      console.error("OPENAI FETCH FAILED:", err);
      return respond("Transport error: upstream request failed.");
    }

    let data = null;
    let rawText = "";
    try {
      rawText = await response.text();
      data = rawText ? JSON.parse(rawText) : null;
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("OPENAI NON-JSON RESPONSE:", rawText);
      return respond("Upstream returned junk. Try again.");
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      const msg =
        data?.error?.message ||
        data?.message ||
        `OpenAI error (${response.status}).`;
      console.error("OPENAI ERROR STATUS:", response.status);
      console.error("OPENAI ERROR BODY:", data);
      return respond(msg);
    }

    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "…";

    // Save memory (never allowed to kill chat)
    try {
      // Save user
      await saveMemory(userId, {
        type: "interaction",
        role: "user",
        content: message,
        importance: "medium",
      });
      // Save assistant
      await saveMemory(userId, {
        type: "interaction",
        role: "assistant",
        content: reply,
        importance: "medium",
      });
    } catch (err) {
      console.error("MEMORY SAVE FAILED:", err);
      // Don't block reply
    }

    return respond(reply);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err?.name === "AbortError") return respond("That took too long. Try again.");
    console.error("API HARD CRASH:", err);
    return respond(`Cipher caught itself. ${safeString(err?.message || "Try again.")}`);
  }
}
