// cipher_os/runtime/orchestrator.js
// Cipher OS Orchestrator V0.6 — OpenAI + Vertex + Anthropic (hardened)

import { chooseModel } from "./routingPolicy.js";

import { openaiGenerate } from "../models/openaiAdapter.js";
import { anthropicGenerate } from "../models/anthropicAdapter.js";
import { vertexGenerate } from "../models/vertexAdapter.js";

const ADAPTERS = {
  openai: {
    fn: openaiGenerate,
    key: "OPENAI_API_KEY",
  },
  vertex: {
    fn: vertexGenerate,
    key: "VERTEX_JSON", // base64 or raw JSON string
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

  // Model routing hint
  let primary = chooseModel({ userMessage });

  // Hard fallback order
  const ordered = ["openai", "vertex", "anthropic"];

  // Only models that actually have keys
  const available = ordered.filter(
    (k) => ADAPTERS[k] && hasKey(ADAPTERS[k].key)
  );

  trace?.log("models.available", { available });

  if (available.length === 0) {
    return {
      reply: "No model API keys available.",
      modelUsed: null,
    };
  }

  // If router chose something invalid, ignore it
  if (!available.includes(primary)) {
    primary = available[0];
  }

  const attemptList = [
    primary,
    ...available.filter((m) => m !== primary),
  ];

  for (const modelKey of attemptList) {
    const entry = ADAPTERS[modelKey];
    if (!entry || !hasKey(entry.key)) continue;

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

      if (out && out.reply) {
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
    reply: "Cipher is online but all models failed. Check API keys.",
    modelUsed: null,
  };
}

export const runtime = "nodejs";
