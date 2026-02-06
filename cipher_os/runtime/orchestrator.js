// cipher_os/runtime/orchestrator.js
// Cipher OS Orchestrator v0.7 — Gemini Primary (Production)

import { geminiGenerate } from "../models/geminiAdapter.js";
import { openaiGenerate } from "../models/openaiAdapter.js";
import { anthropicGenerate } from "../models/anthropicAdapter.js";

const ADAPTERS = {
  gemini: {
    fn: geminiGenerate,
    key: "GEMINI_API_KEY",
  },
  openai: {
    fn: openaiGenerate,
    key: "OPENAI_API_KEY",
  },
  anthropic: {
    fn: anthropicGenerate,
    key: "ANTHROPIC_API_KEY",
  },
};

function hasKey(name) {
  return Boolean(process.env[name] && process.env[name].length > 0);
}

export async function runOrchestrator({
  osContext,
  executivePacket,
  signal,
  trace,
}) {
  const userMessage = osContext?.input?.userMessage || "";
  const uiMessages = osContext?.memory?.uiHistory || [];

  // ✅ Gemini is primary
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
      const out = await entry.fn({
        systemPrompt:
          executivePacket?.systemPrompt ||
          "You are Cipher OS. Respond normally.",
        messages: uiMessages,
        userMessage,
        signal,
        temperature: 0.6,
      });

      // Gemini returns plain text, others may return objects
      const reply =
        typeof out === "string"
          ? out
          : out?.reply || out?.text || null;

      if (reply) {
        trace?.log("model.ok", {
          provider: modelKey,
        });

        return {
          reply,
          modelUsed: {
            provider: modelKey,
          },
        };
      }

      trace?.log("model.empty", { provider: modelKey });
    } catch (err) {
      trace?.log("model.fail", {
        provider: modelKey,
        error: err.message,
      });
    }
  }

  return {
    reply: "All models failed to produce a response.",
    modelUsed: null,
  };
}

export const runtime = "nodejs";
