// cipher_os/runtime/orchestrator.js
// Cipher OS Orchestrator V0.2 — Multi-model + fallback

import { chooseModel } from "./routingPolicy.js";
import { MODEL_REGISTRY } from "./modelRegistry.js";

import { openaiGenerate } from "../models/openaiAdapter.js";
import { anthropicGenerate } from "../models/anthropicAdapter.js";
import { geminiGenerate } from "../models/geminiAdapter.js";

const ADAPTERS = {
  openai: openaiGenerate,
  anthropic: anthropicGenerate,
  gemini: geminiGenerate,
};

export async function runOrchestrator({
  osContext,
  executivePacket,
  signal,
  trace,
}) {
  const userMessage = osContext?.input?.userMessage || "";
  const uiMessages = osContext?.memory?.uiHistory || [];

  const primary = chooseModel({ userMessage });
  trace?.log("route.primary", { primary });

  const fallbackOrder = ["openai", "anthropic", "gemini"]
    .filter((m) => m !== primary);

  const attemptList = [primary, ...fallbackOrder];

  for (const modelKey of attemptList) {
    const adapter = ADAPTERS[modelKey];
    if (!adapter) continue;

    try {
      trace?.log("model.call", { provider: modelKey });

      const out = await adapter({
        systemPrompt: executivePacket?.systemPrompt,
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

  throw new Error("All models failed.");
}
