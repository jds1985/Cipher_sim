// pages/api/chat.js
import { runCipherCore } from "../../cipher_core/core";
import { loadMemory, saveMemory } from "../../cipher_core/memory";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(200).json({ reply: "Method not allowed." });
  }

  try {
    /* ===============================
       ENV CHECK
    ================================ */
    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({
        reply: "Server misconfigured: missing API key.",
      });
    }

    const { message, history = [] } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(200).json({ reply: "Say something real." });
    }

    /* ===============================
       USER (TEMP SINGLE USER)
    ================================ */
    const userId = "jim";

    /* ===============================
       LOAD LONG-TERM MEMORY (GUARDED)
    ================================ */
    let longTermHistory = [];
    try {
      const memoryData = await loadMemory(userId);
      longTermHistory = Array.isArray(memoryData?.history)
        ? memoryData.history
        : [];
    } catch (memErr) {
      console.error("MEMORY LOAD FAILED:", memErr);
      longTermHistory = [];
    }

    /* ===============================
       SHORT-TERM UI HISTORY (SANITIZED)
    ================================ */
    const trimmedHistory = Array.isArray(history)
      ? history.slice(-12).map((m) => ({
          role: m.role === "decipher" ? "assistant" : m.role,
          content: String(m.content || ""),
        }))
      : [];

    /* ===============================
       MERGED CONTEXT (SAFE)
    ================================ */
    const mergedHistory = [...longTermHistory, ...trimmedHistory].slice(-50);

    /* ===============================
       BUILD SYSTEM PROMPT (NEVER THROW)
    ================================ */
    let systemPrompt = "You are Cipher. Respond naturally.";
    try {
      systemPrompt = await runCipherCore(
        { history: mergedHistory },
        { userMessage: message }
      );
    } catch (coreErr) {
      console.error("CORE FAILED:", {
        message: coreErr?.message,
        stack: coreErr?.stack,
      });
    }

    /* ===============================
       OPENAI PAYLOAD
    ================================ */
    const messages = [
      { role: "system", content: systemPrompt },
      ...trimmedHistory,
      { role: "user", content: message },
    ];

    /* ===============================
       OPENAI REQUEST
    ================================ */
    let response;
    try {
      response = await fetch(
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
    } catch (netErr) {
      console.error("OPENAI FETCH FAILED:", netErr);
      return res.status(200).json({
        reply: `Transport error: ${netErr?.message || "network failure"}`,
      });
    }

    /* ===============================
       OPENAI RESPONSE PARSE
    ================================ */
    let data;
    try {
      data = await response.json();
    } catch (parseErr) {
      console.error("OPENAI JSON PARSE FAILED");
      return res.status(200).json({
        reply: "OpenAI returned invalid JSON.",
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

    /* ===============================
       SAVE MEMORY (NON-BLOCKING)
    ================================ */
    try {
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
    } catch (saveErr) {
      console.error("MEMORY SAVE FAILED:", saveErr);
    }

    return res.status(200).json({ reply });
  } catch (err) {
    /* ===============================
       FINAL SAFETY NET — NO SILENCE
    ================================ */
    console.error("API CRASH FULL:", {
      message: err?.message,
      stack: err?.stack,
      name: err?.name,
    });

    return res.status(200).json({
      reply: `API crash: ${err?.message || "unknown error"}`,
    });
  }
}
