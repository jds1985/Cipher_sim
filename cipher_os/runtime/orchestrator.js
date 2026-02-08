// cipher_os/runtime/orchestrator.js
// Cipher OS Orchestrator v0.9 — Intelligent Routing + Telemetry + Streaming (OpenAI-first)

import { geminiGenerate } from "../models/geminiAdapter.js";
import { openaiGenerate, openaiGenerateStream } from "../models/openaiAdapter.js";
import { anthropicGenerate } from "../models/anthropicAdapter.js";

const ADAPTERS = {
  gemini: {
    fn: geminiGenerate,
    key: "GEMINI_API_KEY",
    supportsSignal: false,
    supportsStream: false,
  },
  openai: {
    fn: openaiGenerate,
    streamFn: openaiGenerateStream,
    key: "OPENAI_API_KEY",
    supportsSignal: true,
    supportsStream: true,
  },
  anthropic: {
    fn: anthropicGenerate,
    key: "ANTHROPIC_API_KEY",
    supportsSignal: true,
    supportsStream: false, // keep false for now (we can add later)
  },
};

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

/**
 * runOrchestrator supports:
 * - normal mode: returns { reply, modelUsed }
 * - stream mode: calls onToken(delta) and returns { reply, modelUsed }
 */
export async function runOrchestrator({
  osContext,
  executivePacket,
  signal,
  trace,
  stream = false,
  onToken,
}) {
  const userMessage = osContext?.input?.userMessage;

  if (!userMessage || typeof userMessage !== "string" || !userMessage.trim()) {
    trace?.log("input.invalid", { userMessage });
    return { reply: "⚠️ Empty input received.", modelUsed: null };
  }

  const intent = classifyIntent(userMessage);

  // Preferred order by intent
  let preferredOrder;
  if (intent === "code") preferredOrder = ["anthropic", "openai", "gemini"];
  else if (intent === "reasoning") preferredOrder = ["gemini", "openai", "anthropic"];
  else preferredOrder = ["openai", "gemini", "anthropic"];

  // Streaming: force OpenAI first if available (prevents long dead air)
  if (stream && hasKey(ADAPTERS.openai.key)) {
    preferredOrder = ["openai", ...preferredOrder.filter((x) => x !== "openai")];
  }

  const available = preferredOrder.filter(
    (k) => ADAPTERS[k] && hasKey(ADAPTERS[k].key)
  );

  trace?.log("router.decision", { intent, order: available, stream });

  if (available.length === 0) {
    return { reply: "No AI providers are configured.", modelUsed: null };
  }

  for (const modelKey of available) {
    const entry = ADAPTERS[modelKey];
    if (!entry) continue;

    trace?.log("model.call", { provider: modelKey, streamRequested: stream });

    const startTime = Date.now();

    try {
      const systemPrompt =
        executivePacket?.systemPrompt || "You are Cipher OS. Respond normally.";

      const payload =
        modelKey === "gemini"
          ? {
              systemPrompt,
              userMessage,
              temperature: 0.6,
            }
          : {
              systemPrompt,
              messages: osContext?.memory?.uiHistory || [],
              userMessage,
              temperature: 0.6,
            };

      if (entry.supportsSignal) payload.signal = signal;

      // STREAM PATH (OpenAI only for now)
      if (stream && entry.supportsStream && typeof entry.streamFn === "function") {
        let replyLen = 0;

        const out = await entry.streamFn({
          ...payload,
          onToken: (delta) => {
            replyLen += delta?.length || 0;
            try {
              onToken?.(delta);
            } catch {}
          },
        });

        const latencyMs = Date.now() - startTime;
        const reply = extractReply(out) || "";

        trace?.log("model.telemetry", {
          provider: modelKey,
          model: out?.modelUsed || "unknown",
          latencyMs,
          replyLength: replyLen || reply.length,
          success: Boolean(reply),
          streamed: true,
        });

        if (reply) {
          return {
            reply,
            modelUsed: { provider: modelKey, model: out?.modelUsed || "unknown" },
          };
        }

        trace?.log("model.empty", { provider: modelKey, streamed: true });
        continue;
      }

      // NON-STREAM PATH
      const out = await entry.fn(payload);
      const latencyMs = Date.now() - startTime;

      const reply = extractReply(out);

      trace?.log("model.telemetry", {
        provider: modelKey,
        model: out?.modelUsed || "unknown",
        latencyMs,
        replyLength: reply ? reply.length : 0,
        success: Boolean(reply),
        streamed: false,
      });

      if (reply) {
        return {
          reply,
          modelUsed: { provider: modelKey, model: out?.modelUsed || "unknown" },
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

  return { reply: "All models failed to produce a response.", modelUsed: null };
}

export const runtime = "nodejs";
