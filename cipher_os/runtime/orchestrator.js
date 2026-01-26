// cipher_os/runtime/orchestrator.js
// Cipher OS Orchestrator V0 (Phase 1: OpenAI only, but structured)

import { chooseModel } from "./routingPolicy";
import { MODEL_REGISTRY } from "./modelRegistry";
import { openaiGenerate } from "../models/openaiAdapter";

export async function runOrchestrator({
  osContext,
  executivePacket,
  signal,
  trace,
}) {
  const userMessage = osContext?.input?.userMessage || "";
  const uiMessages = osContext?.memory?.uiHistory || [];

  // Decide model (Phase 1: always OpenAI)
  const chosen = chooseModel({ userMessage });

  trace?.log("route.decide", { chosen });

  const modelInfo = MODEL_REGISTRY[chosen];
  if (!modelInfo || modelInfo.enabled !== true) {
    trace?.log("route.error", { reason: "model_disabled_or_missing", chosen });
    throw new Error(`Model unavailable: ${chosen}`);
  }

  // Call adapter
  if (chosen === "openai") {
    trace?.log("model.call", { provider: "openai" });

    const out = await openaiGenerate({
      systemPrompt: executivePacket?.systemPrompt,
      messages: uiMessages,
      userMessage,
      signal,
      temperature: 0.6,
    });

    trace?.log("model.ok", { provider: "openai", model: out.modelUsed });

    return {
      reply: out.reply,
      modelUsed: { provider: "openai", model: out.modelUsed },
    };
  }

  // Future providers will go here (anthropic/gemini)
  throw new Error(`No adapter implemented for: ${chosen}`);
}
