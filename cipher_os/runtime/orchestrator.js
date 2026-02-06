// cipher_os/runtime/orchestrator.js
// Cipher OS Orchestrator v0.7.2 — Gemini Primary (HARDENED)

import { geminiGenerate } from "../models/geminiAdapter.js";
import { openaiGenerate } from "../models/openaiAdapter.js";
import { anthropicGenerate } from "../models/anthropicAdapter.js";

const ADAPTERS = {
  gemini: {
    fn: geminiGenerate,
    key: "GEMINI_API_KEY",
    supportsSignal: false,
  },
  openai: {
    fn: openaiGenerate,
    key: "OPENAI_API_KEY",
    supportsSignal: true,
  },
  anthropic: {
    fn: anthropicGenerate,
    key: "ANTHROPIC_API_KEY",
    supportsSignal: true,
  },
};

function hasKey(name) {
  return Boolean(process.env[name] && process.env[name].length > 0);
}

function extractReply(out) {
  // 🔒 Canonical reply extraction (no ghosts allowed)
  if (!out) return null;

  if (typeof out === "string") return out.trim();
  if (typeof out.reply === "string") return out.reply.trim();
  if (typeof out.text === "string") return out.text.trim();

  return null;
}

export async function runOrchestrator({
  osContext,
  executivePacket,
  signal,
  trace,
}) {
  const userMessage = osContext?.input?.userMessage || "";
  const uiMessages = osContext?.memory?.uiHistory || [];

  // Gemini → OpenAI → Anthropic
  const ordered = ["gemini", "openai", "anthropic"];

  const available = ordered.filter(
    (k) => ADAPTERS[k] && hasKey(ADAPTERS[k].key)
  );

  trace?.log("models.available", { available });

  if (available.length === 0) {
    return {
      reply: "No AI providers are configured.",
      modelUsed: null,
    };
  }

  for (const modelKey of available) {
    const entry = ADAPTERS[modelKey];
    if (!entry) continue;

    trace?.log("model.call", { provider: modelKey });

    try {
      const payload = {
        systemPrompt:
          executivePacket?.systemPrompt ||
          "You are Cipher OS. Respond normally.",
        messages: uiMessages,
        userMessage,
        temperature: 0.6,
      };

      if (entry.supportsSignal) {
        payload.signal = signal;
      }

      const out = await entry.fn(payload);

      // 🔥 DEBUG SAFETY (optional, remove later)
      trace?.log("model.raw", {
        provider: modelKey,
        type: typeof out,
      });

      const reply = extractReply(out);

      if (reply) {
        trace?.log("model.ok", {
          provider: modelKey,
          model: out?.modelUsed || "unknown",
        });

        return {
          reply,
          modelUsed: {
            provider: modelKey,
            model: out?.modelUsed || "unknown",
          },
        };
      }

      trace?.log("model.empty", { provider: modelKey });
    } catch (err) {
      trace?.log("model.fail", {
        provider: modelKey,
        error: err?.message || String(err),
      });
    }
  }

  return {
    reply: "All models failed to produce a response.",
    modelUsed: null,
  };
}

export const runtime = "nodejs";
