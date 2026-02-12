export const runtime = "nodejs";
// cipher_os/runtime/orchestrator.js
// Cipher OS Orchestrator v1.0 — Intent Routing + Telemetry + Streaming + Pseudo-Stream
// Goal: Use the best model per task (Claude for code, Gemini for deep reasoning, OpenAI for chat),
// while keeping your SSE UI "streamy" even when the provider can't truly stream.

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
    supportsStream: false, // true streaming later if you add it
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
  const t = String(text || "").toLowerCase();

  // Code / dev
  if (
    t.includes("code") ||
    t.includes("function") ||
    t.includes("debug") ||
    t.includes("error") ||
    t.includes("stack trace") ||
    t.includes("javascript") ||
    t.includes("typescript") ||
    t.includes("next.js") ||
    t.includes("api") ||
    t.includes("firebase") ||
    t.includes("vercel") ||
    t.includes("react") ||
    t.includes("node")
  ) {
    return "code";
  }

  // Deep reasoning / research
  if (
    t.includes("analyze") ||
    t.includes("explain deeply") ||
    t.includes("deep dive") ||
    t.includes("research") ||
    t.includes("compare") ||
    t.includes("pros and cons") ||
    t.includes("long") ||
    t.includes("step by step") ||
    t.includes("architecture") ||
    t.includes("system design")
  ) {
    return "reasoning";
  }

  return "chat";
}

/**
 * Pseudo-stream helper:
 * For providers that don't stream, we still want UI deltas.
 * We chunk the final reply and call onToken(chunk) rapidly.
 */
function pseudoStream(reply, onToken, chunkSize = 28) {
  if (!reply || typeof reply !== "string") return 0;
  if (typeof onToken !== "function") return reply.length;

  let sent = 0;
  for (let i = 0; i < reply.length; i += chunkSize) {
    const chunk = reply.slice(i, i + chunkSize);
    sent += chunk.length;
    try {
      onToken(chunk);
    } catch {}
  }
  return sent;
}

function buildPreferredOrder(intent, streamRequested) {
  // v1 routing policy:
  // - code: Claude -> OpenAI -> Gemini
  // - reasoning: Gemini -> OpenAI -> Claude
  // - chat: OpenAI -> Gemini -> Claude
  let base =
    intent === "code"
      ? ["anthropic", "openai", "gemini"]
      : intent === "reasoning"
      ? ["gemini", "openai", "anthropic"]
      : ["openai", "gemini", "anthropic"];

  // If streaming requested, we *prefer* OpenAI first ONLY IF it's available,
  // but we do NOT force it anymore. We'll pseudo-stream other providers.
  // We keep OpenAI early for responsiveness but still allow routing by intent.
  if (streamRequested && base[0] !== "openai") {
    // keep the intent-first model first, but move openai to second if present
    base = [base[0], "openai", ...base.filter((x) => x !== base[0] && x !== "openai")];
  }

  return base;
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
    trace?.log?.("input.invalid", { userMessage });
    return { reply: "⚠️ Empty input received.", modelUsed: null };
  }

  const intent = classifyIntent(userMessage);
  const preferredOrder = buildPreferredOrder(intent, stream);

  const available = preferredOrder.filter((k) => ADAPTERS[k] && hasKey(ADAPTERS[k].key));

  trace?.log?.("router.decision", { intent, order: available, stream });

  if (available.length === 0) {
    return { reply: "No AI providers are configured.", modelUsed: null };
  }

  const systemPrompt =
    executivePacket?.systemPrompt || "You are Cipher OS. Respond normally.";

  for (const modelKey of available) {
    const entry = ADAPTERS[modelKey];
    if (!entry) continue;

    trace?.log?.("model.call", { provider: modelKey, streamRequested: stream });

    const startTime = Date.now();

    try {
      // Gemini uses different shape (systemPrompt + userMessage). Others use messages + userMessage.
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

      // TRUE STREAM (OpenAI only right now)
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

        trace?.log?.("model.telemetry", {
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

        trace?.log?.("model.empty", { provider: modelKey, streamed: true });
        continue;
      }

      // NON-STREAM CALL (Gemini/Claude/OpenAI fallback)
      const out = await entry.fn(payload);
      const latencyMs = Date.now() - startTime;

      const reply = extractReply(out);

      // If UI requested stream, simulate deltas so ChatPanel still feels alive
      let streamedLen = 0;
      if (stream && reply) {
        streamedLen = pseudoStream(reply, onToken, 28);
      }

      trace?.log?.("model.telemetry", {
        provider: modelKey,
        model: out?.modelUsed || "unknown",
        latencyMs,
        replyLength: reply ? reply.length : 0,
        success: Boolean(reply),
        streamed: Boolean(stream && reply), // pseudo-stream counts as streamed for UX
        pseudoStream: Boolean(stream && reply && !entry.supportsStream),
        pseudoStreamLength: streamedLen || 0,
      });

      if (reply) {
        return {
          reply,
          modelUsed: { provider: modelKey, model: out?.modelUsed || "unknown" },
        };
      }

      trace?.log?.("model.empty", { provider: modelKey });
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      trace?.log?.("model.fail", {
        provider: modelKey,
        latencyMs,
        error: err?.message || String(err),
      });
    }
  }

  return { reply: "All models failed to produce a response.", modelUsed: null };
}
