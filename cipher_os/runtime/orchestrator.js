// cipher_os/runtime/orchestrator.js
// Cipher OS Orchestrator v0.8 — Intelligent Routing + Telemetry + Output Governor

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

const MAX_REPLY_CHARS = 2000; // 🧯 transport safety limit

function hasKey(name) {
  return Boolean(process.env[name] && process.env[name].length > 0);
}

function extractReply(out) {
  if (!out) return null;
  if (typeof out === "string") return out.trim();
  if (typeof out.reply === "string") return out.reply.trim();
  if (typeof out.text === "string") return out.text.trim();
  return null;
}

/**
 * 🧠 Tiny Intent Router
 */
function classifyIntent(text = "") {
  const t = text.toLowerCase();

  if (
    t.includes("code") ||
    t.includes("function") ||
    t.includes("debug") ||
    t.includes("error") ||
    t.includes("javascript") ||
    t.includes("api")
  ) {
    return "code";
  }

  if (
    t.includes("analyze") ||
    t.includes("explain deeply") ||
    t.includes("long") ||
    t.includes("research")
  ) {
    return "reasoning";
  }

  return "chat";
}

export async function runOrchestrator({
  osContext,
  executivePacket,
  signal,
  trace,
}) {
  const userMessage = osContext?.input?.userMessage;

  if (!userMessage || typeof userMessage !== "string" || !userMessage.trim()) {
    trace?.log("input.invalid", { userMessage });
    return {
      reply: "⚠️ Empty input received.",
      modelUsed: null,
    };
  }

  const intent = classifyIntent(userMessage);

  /**
   * 🧭 Preferred model by job
   */
  let preferredOrder;

  if (intent === "code") {
    preferredOrder = ["anthropic", "openai", "gemini"];
  } else if (intent === "reasoning") {
    preferredOrder = ["gemini", "openai", "anthropic"];
  } else {
    preferredOrder = ["openai", "gemini", "anthropic"];
  }

  const available = preferredOrder.filter(
    (k) => ADAPTERS[k] && hasKey(ADAPTERS[k].key)
  );

  trace?.log("router.decision", { intent, order: available });

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

    const startTime = Date.now();

    try {
      const payload =
        modelKey === "gemini"
          ? {
              systemPrompt:
                executivePacket?.systemPrompt ||
                "You are Cipher OS. Respond normally.",
              userMessage,
              temperature: 0.6,
            }
          : {
              systemPrompt:
                executivePacket?.systemPrompt ||
                "You are Cipher OS. Respond normally.",
              messages: osContext?.memory?.uiHistory || [],
              userMessage,
              temperature: 0.6,
            };

      if (entry.supportsSignal) {
        payload.signal = signal;
      }

      const out = await entry.fn(payload);
      const latencyMs = Date.now() - startTime;

      let reply = extractReply(out);

      trace?.log("model.telemetry", {
        provider: modelKey,
        model: out?.modelUsed || "unknown",
        latencyMs,
        replyLength: reply ? reply.length : 0,
        success: Boolean(reply),
      });

      if (reply) {
        // 🧯 OUTPUT GOVERNOR
        if (reply.length > MAX_REPLY_CHARS) {
          trace?.log("reply.clamped", {
            originalLength: reply.length,
            max: MAX_REPLY_CHARS,
          });

          reply =
            reply.slice(0, MAX_REPLY_CHARS) +
            "\n\n⚠️ Output truncated due to size limits.";
        }

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
      const latencyMs = Date.now() - startTime;

      trace?.log("model.fail", {
        provider: modelKey,
        latencyMs,
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
