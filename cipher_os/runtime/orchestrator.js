// cipher_os/runtime/orchestrator.js
// Cipher OS Orchestrator V0.5 — OpenAI + Vertex + Anthropic

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
    key: "VERTEX_JSON",
  },
  anthropic: {
    fn: anthropicGenerate,
    key: "ANTHROPIC_API_KEY",
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

  // NEW FALLBACK ORDER
  const ordered = ["openai", "vertex", "anthropic"];

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

  const attemptList = [
    primary,
    ...available.filter((m) => m !== primary),
  ].filter((v, i, a) => a.indexOf(v) === i);

  for (const modelKey of attemptList) {
    const entry = ADAPTERS[modelKey];
    if (!entry || !hasKey(entry.key)) continue;

    trace?.log("model.call", { provider: modelKey });

    let out = null;

    try {
      out = await entry.fn({
        systemPrompt:
          executivePacket?.systemPrompt ||
          "You are Cipher OS. Respond normally.",
        messages: uiMessages,
        userMessage,
        signal,
        temperature: 0.6,
      });
    } catch (err) {
      trace?.log("model.exception", {
        provider: modelKey,
        error: err.message,
      });
      continue;
    }

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

    trace?.log("model.null", {
      provider: modelKey,
    });
  }

  return {
    reply: "Cipher is online but all models failed. Check API keys.",
    modelUsed: null,
  };
}

export const runtime = "nodejs";
