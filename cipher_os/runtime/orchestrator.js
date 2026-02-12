export const runtime = "nodejs";
// Cipher OS Orchestrator v2.0 — Intent Routing + Telemetry + Streaming + Pseudo-Stream + Auto Scoring

import { geminiGenerate } from "../models/geminiAdapter.js";
import { openaiGenerate, openaiGenerateStream } from "../models/openaiAdapter.js";
import { anthropicGenerate } from "../models/anthropicAdapter.js";

/* ===============================
   PROVIDER REGISTRY
================================ */
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
    supportsStream: false,
  },
};

/* ===============================
   LIVE SCOREBOARD (v1 memory)
================================ */
const SCOREBOARD = {
  anthropic: { success: 1, fail: 0, avgLatency: 2000 },
  openai: { success: 1, fail: 0, avgLatency: 2000 },
  gemini: { success: 1, fail: 0, avgLatency: 2000 },
};

function updateScore(provider, { success, latency }) {
  const row = SCOREBOARD[provider];
  if (!row) return;

  if (success) row.success += 1;
  else row.fail += 1;

  // rolling latency average
  row.avgLatency = Math.round((row.avgLatency * 0.7) + (latency * 0.3));
}

function computeScore(provider) {
  const row = SCOREBOARD[provider];
  if (!row) return 0;

  const reliability = row.success / (row.success + row.fail);
  const speed = 1 / Math.max(row.avgLatency, 1);

  return reliability * 0.8 + speed * 0.2;
}

/* ===============================
   HELPERS
================================ */
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

  if (
    t.includes("write") ||
    t.includes("build") ||
    t.includes("create") ||
    t.includes("generate") ||
    t.includes("make") ||
    t.includes("implement") ||
    t.includes("debug") ||
    t.includes("error") ||
    t.includes("fix") ||
    t.includes("refactor") ||
    t.includes("javascript") ||
    t.includes("typescript") ||
    t.includes("react") ||
    t.includes("next") ||
    t.includes("api") ||
    t.includes("firebase")
  ) {
    return "code";
  }

  if (
    t.includes("analyze") ||
    t.includes("compare") ||
    t.includes("why") ||
    t.includes("architecture") ||
    t.includes("system design")
  ) {
    return "reasoning";
  }

  return "chat";
}

function pseudoStream(reply, onToken, chunkSize = 28) {
  if (!reply || typeof onToken !== "function") return reply?.length || 0;

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

/* ===============================
   INTENT + SCORE ROUTING
================================ */
function buildPreferredOrder(intent, streamRequested) {
  let base =
    intent === "code"
      ? ["anthropic", "openai", "gemini"]
      : intent === "reasoning"
      ? ["gemini", "openai", "anthropic"]
      : ["openai", "gemini", "anthropic"];

  // sort by live score but keep intent bias strong
  const scored = [...base].sort((a, b) => computeScore(b) - computeScore(a));

  if (streamRequested && scored[0] !== "openai") {
    scored.splice(1, 0, "openai");
    return [...new Set(scored)];
  }

  return scored;
}

/* ===============================
   MAIN ORCHESTRATOR
================================ */
export async function runOrchestrator({
  osContext,
  executivePacket,
  signal,
  trace,
  stream = false,
  onToken,
}) {
  const userMessage = osContext?.input?.userMessage;

  if (!userMessage || !userMessage.trim()) {
    trace?.log?.("input.invalid", { userMessage });
    return { reply: "⚠️ Empty input received.", modelUsed: null };
  }

  const intent = classifyIntent(userMessage);
  const preferredOrder = buildPreferredOrder(intent, stream);

  const available = preferredOrder.filter(
    (k) => ADAPTERS[k] && hasKey(ADAPTERS[k].key)
  );

  trace?.log?.("router.decision", {
    intent,
    order: available,
    stream,
    scores: Object.fromEntries(
      Object.keys(SCOREBOARD).map((k) => [k, computeScore(k)])
    ),
  });

  if (!available.length) {
    return { reply: "No AI providers are configured.", modelUsed: null };
  }

  const systemPrompt =
    executivePacket?.systemPrompt || "You are Cipher OS. Respond normally.";

  for (const modelKey of available) {
    const entry = ADAPTERS[modelKey];
    const startTime = Date.now();

    try {
      trace?.log?.("model.call", { provider: modelKey });

      const payload =
        modelKey === "gemini"
          ? { systemPrompt, userMessage, temperature: 0.6 }
          : {
              systemPrompt,
              messages: osContext?.memory?.uiHistory || [],
              userMessage,
              temperature: 0.6,
            };

      if (entry.supportsSignal) payload.signal = signal;

      // TRUE STREAM
      if (stream && entry.supportsStream && entry.streamFn) {
        let replyLen = 0;

        const out = await entry.streamFn({
          ...payload,
          onToken: (delta) => {
            replyLen += delta?.length || 0;
            onToken?.(delta);
          },
        });

        const reply = extractReply(out) || "";
        const latency = Date.now() - startTime;

        updateScore(modelKey, { success: Boolean(reply), latency });

        if (reply) {
          return {
            reply,
            modelUsed: { provider: modelKey, model: out?.modelUsed || "unknown" },
          };
        }

        continue;
      }

      // NORMAL CALL
      const out = await entry.fn(payload);
      const reply = extractReply(out);
      const latency = Date.now() - startTime;

      updateScore(modelKey, { success: Boolean(reply), latency });

      let pseudoLen = 0;
      if (stream && reply) pseudoLen = pseudoStream(reply, onToken);

      trace?.log?.("model.telemetry", {
        provider: modelKey,
        latency,
        replyLength: reply?.length || 0,
        pseudoStream: Boolean(stream && reply && !entry.supportsStream),
        pseudoStreamLength: pseudoLen,
      });

      if (reply) {
        return {
          reply,
          modelUsed: { provider: modelKey, model: out?.modelUsed || "unknown" },
        };
      }
    } catch (err) {
      const latency = Date.now() - startTime;
      updateScore(modelKey, { success: false, latency });

      trace?.log?.("model.fail", {
        provider: modelKey,
        latency,
        error: err?.message || String(err),
      });
    }
  }

  return { reply: "All models failed to produce a response.", modelUsed: null };
}
