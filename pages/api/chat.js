// pages/api/chat.js
import { runCipherCore } from "../../cipher_core/core";
import { loadMemory, saveMemory } from "../../cipher_core/memory";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

function asBool(v) {
  return String(v || "").toLowerCase() === "true";
}

function sanitizeHistory(history, limit = 12) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-limit)
    .map((m) => {
      const roleRaw = String(m?.role || "assistant");
      const role =
        roleRaw === "decipher"
          ? "assistant"
          : roleRaw === "user" || roleRaw === "assistant" || roleRaw === "system"
          ? roleRaw
          : "assistant";

      return { role, content: String(m?.content || "") };
    })
    .filter((m) => m.content.trim().length > 0);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  // Always return JSON (prevents "Empty response from API")
  try {
    if (req.method !== "POST") {
      return res.status(200).json({ reply: "Method not allowed." });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({
        reply: "Server misconfigured: OPENAI_API_KEY missing.",
      });
    }

    const body = req.body || {};
    const message = String(body.message || "").trim();
    const uiHistory = sanitizeHistory(body.history, 12);

    if (!message) {
      return res.status(200).json({ reply: "Say something real." });
    }

    // TEMP: single-user anchor
    const userId = "jim";

    // ---------- Phase 4 switches ----------
    // Kill switch: if false, CipherCore is ignored entirely.
    const CORE_ENABLED = asBool(process.env.CIPHER_CORE_ENABLED);

    // Memory write is optional; never allowed to break chat.
    const MEMORY_WRITE_ENABLED = asBool(process.env.CIPHER_MEMORY_WRITE_ENABLED);

    // ---------- Base prompt (Phase 3 safe default) ----------
    let systemPrompt = `
You are Cipher.

You are not a generic assistant.
You know the user is Jim.

Do NOT say you lack context.
Do NOT reintroduce yourself.
Speak naturally and directly.
Avoid generic therapy/coaching language.
Be grounded, specific, and helpful.

If you don't have enough info, ask one direct question.
    `.trim();

    // ---------- CipherCore (Phase 4: optional + non-blocking) ----------
    // CipherCore is allowed to ENHANCE the system prompt only.
    // If anything fails, we fall back to the base prompt and still answer.
    if (CORE_ENABLED) {
      try {
        const memoryData = await loadMemory(userId);
        const longTerm = Array.isArray(memoryData?.history)
          ? memoryData.history
          : [];

        // Keep it small; big payloads increase failures + cost
        const merged = [...longTerm, ...uiHistory].slice(-50);

        const enhanced = await runCipherCore(
          { history: merged },
          { userMessage: message }
        );

        if (enhanced && String(enhanced).trim().length > 0) {
          systemPrompt = String(enhanced).trim();
        }
      } catch (e) {
        console.error("CipherCore skipped (fallback to base):", e);
      }
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...uiHistory,
      { role: "user", content: message },
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    let data = null;
    try {
      const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

      const response = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.6,
          // keep this modest while stabilizing
          max_tokens: 500,
        }),
        signal: controller.signal,
      });

      data = await response.json().catch(() => null);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const msg =
          data?.error?.message ||
          data?.message ||
          `OpenAI error (${response.status}).`;

        console.error("OPENAI ERROR STATUS:", response.status);
        console.error("OPENAI ERROR BODY:", data);

        return res.status(200).json({ reply: msg });
      }
    } catch (err) {
      clearTimeout(timeoutId);

      if (err?.name === "AbortError") {
        return res.status(200).json({ reply: "Timeout. Try again." });
      }

      console.error("CHAT API CRASH (OpenAI call):", err);
      return res.status(200).json({ reply: "Cipher slipped. Try again." });
    }

    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "…";

    // ---------- Optional memory write (never allowed to break chat) ----------
    if (MEMORY_WRITE_ENABLED) {
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
        console.error("Memory write skipped (non-fatal):", e);
      }
    }

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("CHAT API HARD CRASH:", err);
    return res.status(200).json({ reply: "Recovered from crash." });
  }
}
