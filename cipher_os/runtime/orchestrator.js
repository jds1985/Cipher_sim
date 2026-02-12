export const runtime = "nodejs";

// Cipher OS Orchestrator v2.2
// Intent Routing + Telemetry + Streaming + Pseudo-Stream
// Auto scoring + run history + failure visibility

import { geminiGenerate } from "../models/geminiAdapter.js";
import { openaiGenerate, openaiGenerateStream } from "../models/openaiAdapter.js";
import { anthropicGenerate } from "../models/anthropicAdapter.js";
import { setLastRun } from "./debugState.js";

/* ===============================
   PROVIDERS
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
   SCOREBOARD
================================ */
const SCOREBOARD = {
  anthropic: { success: 1, fail: 0, avgLatency: 2000 },
  openai: { success: 1, fail: 0, avgLatency: 2000 },
  gemini: { success: 1, fail: 0, avgLatency: 2000 },
};

function updateScore(provider, { success, latency }) {
  const row = SCOREBOARD[provider];
  if (!row) return;

  if (success) row.success++;
  else row.fail++;

  row.avgLatency = Math.round(row.avgLatency * 0.7 + latency * 0.3);
}

function computeScore(provider) {
  const row = SCOREBOARD[provider];
  if (!row) return 0;

  const reliability = row.success / (row.success + row.fail);
  const speed = 1 / Math.max(row.avgLatency, 1);

  return reliability * 0.8 + speed * 0.2;
}

/* ===============================
   UTIL
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
  const t = String(text).toLowerCase();

  if (
    t.includes("write") ||
    t.includes("build") ||
    t.includes("create") ||
    t.includes("generate") ||
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
  ) return "code";

  if (
    t.includes("analyze") ||
    t.includes("compare") ||
    t.includes("why") ||
    t.includes("architecture") ||
    t.includes("system design")
  ) return "reasoning";

  return "chat";
}

function pseudoStream(reply, onToken, chunkSize = 28) {
  if (!reply || typeof onToken !== "function") return;

  for (let i = 0; i < reply.length; i += chunkSize) {
    try {
      onToken(reply.slice(i, i + chunkSize));
    } catch {}
  }
}

/* ===============================
   ROUTING
================================ */
function buildPreferredOrder(intent) {
  const base =
    intent === "code"
      ? ["anthropic", "openai", "gemini"]
      : intent === "reasoning"
      ? ["gemini", "openai", "anthropic"]
      : ["openai", "gemini", "anthropic"];

  return [...base].sort((a, b) => computeScore(b) - computeScore(a));
}

/* ===============================
   MAIN
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

  if (!userMessage?.trim()) {
    return { reply: "⚠️ Empty input received.", modelUsed: null };
  }

  const intent = classifyIntent(userMessage);
  const order = buildPreferredOrder(intent);

  const available = order.filter(
    (k) => ADAPTERS[k] && hasKey(ADAPTERS[k].key)
  );

  if (!available.length) {
    setLastRun({ intent, orderTried: [], chosen: null, success: false });
    return { reply: "No AI providers are configured.", modelUsed: null };
  }

  const systemPrompt =
    executivePacket?.systemPrompt || "You are Cipher OS.";

  const attempts = [];

  for (const provider of available) {
    const entry = ADAPTERS[provider];
    const start = Date.now();

    try {
      attempts.push(provider);

      const payload =
        provider === "gemini"
          ? { systemPrompt, userMessage, temperature: 0.6 }
          : {
              systemPrompt,
              messages: osContext?.memory?.uiHistory || [],
              userMessage,
              temperature: 0.6,
            };

      if (entry.supportsSignal) payload.signal = signal;

      // STREAM
      if (stream && entry.supportsStream && entry.streamFn) {
        const out = await entry.streamFn({ ...payload, onToken });
        const reply = extractReply(out) || "";
        const latency = Date.now() - start;

        updateScore(provider, { success: Boolean(reply), latency });

        if (reply) {
          setLastRun({
            intent,
            orderTried: attempts,
            chosen: provider,
            latencyMs: latency,
            stream,
            success: true,
          });

          return {
            reply,
            modelUsed: { provider, model: out?.modelUsed || "unknown" },
          };
        }

        continue;
      }

      // NORMAL
      const out = await entry.fn(payload);
      const reply = extractReply(out);
      const latency = Date.now() - start;

      updateScore(provider, { success: Boolean(reply), latency });

      if (stream && reply) pseudoStream(reply, onToken);

      if (reply) {
        setLastRun({
          intent,
          orderTried: attempts,
          chosen: provider,
          latencyMs: latency,
          stream,
          success: true,
        });

        return {
          reply,
          modelUsed: { provider, model: out?.modelUsed || "unknown" },
        };
      }
    } catch (err) {
      updateScore(provider, { success: false, latency: Date.now() - start });
    }
  }

  setLastRun({
    intent,
    orderTried: attempts,
    chosen: null,
    success: false,
  });

  return { reply: "All models failed to produce a response.", modelUsed: null };
}
