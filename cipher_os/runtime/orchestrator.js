// cipher_os/runtime/orchestrator.js
// Cipher OS Orchestrator V0.3 — Safe multi-model fallback

import { chooseModel } from "./routingPolicy.js";

import { openaiGenerate } from "../models/openaiAdapter.js";
import { anthropicGenerate } from "../models/anthropicAdapter.js";
import { geminiGenerate } from "../models/geminiAdapter.js";

const ADAPTERS = {
  openai: {
    fn: openaiGenerate,
    key: "OPENAI_API_KEY",
  },
  anthropic: {
    fn: anthropicGenerate,
    key: "ANTHROPIC_API_KEY",
  },
  gemini: {
    fn: geminiGenerate,
    key: "GEMINI_API_KEY",
  },
};

function hasKey(name) {
  return Boolean(process.env[name]);
}

export async function runOrchestrator({
  osContext,
  executivePacket,
  signal,
  trace,
}) {
  const userMessage = osContext?.input?.userMessage || "";
  const uiMessages = osContext?.memory?.uiHistory || [];

  const primary = chooseModel({ userMessage });

  const ordered = ["openai", "anthropic", "gemini"];

  const available = ordered.filter(
    (k) => ADAPTERS[k] && hasKey(ADAPTERS[k].key)
  );

  trace?.log("models.available", { available });

  if (available.length === 0) {
    throw new Error("No model API keys available.");
  }

  const attemptList = [
    primary,
    ...available.filter((m) => m !== primary),
  ].filter((v, i, a) => a.indexOf(v) === i);

  for (const modelKey of attemptList) {
    const entry = ADAPTERS[modelKey];
    if (!entry || !hasKey(entry.key)) continue;

    try {
      trace?.log("model.call", { provider: modelKey });

      const out = await entry.fn({
        systemPrompt:
          executivePacket?.systemPrompt ||
          "You are Cipher OS. Respond normally.",
        messages: uiMessages,
        userMessage,
        signal,
        temperature: 0.6,
      });

      trace?.log("model.ok", {
        provider: modelKey,
        model: out.modelUsed,
      });

      return {
        reply: out.reply,
        modelUsed: {
          provider: modelKey,
          model: out.modelUsed,
        },
      };
    } catch (err) {
      trace?.log("model.fail", {
        provider: modelKey,
        error: err.message,
      });
    }
  }

  return {
    reply: "Cipher is online but all models failed. Check API keys.",
    modelUsed: null,
  };
}
