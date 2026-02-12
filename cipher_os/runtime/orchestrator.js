export const runtime = "nodejs";

// Cipher OS Orchestrator v2.3
// Adds: telemetry snapshots + recent runs feed for the dashboard

import { geminiGenerate } from "../models/geminiAdapter.js";
import { openaiGenerate, openaiGenerateStream } from "../models/openaiAdapter.js";
import { anthropicGenerate } from "../models/anthropicAdapter.js";
import { setLastRun } from "./debugState.js";
import { setScores, recordRun } from "./telemetryState.js";

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
   SCOREBOARD (in-memory)
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

function buildScoreSnapshot() {
  const out = {};
  for (const k of Object.keys(SCOREBOARD)) {
    out[k] = {
      score: Number(computeScore(k).toFixed(4)),
      success: SCOREBOARD[k].success,
      fail: SCOREBOARD[k].fail,
      avgLatency: SCOREBOARD[k].avgLatency,
    };
  }
  return out;
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
    setScores(buildScoreSnapshot());
    setLastRun({ intent: null, orderTried: [], chosen: null, success: false });
    recordRun({
      timestamp: Date.now(),
      intent: null,
      orderTried: [],
      chosen: null,
      stream,
      success: false,
      latencyMs: 0,
      error: "Empty input",
    });
    return { reply: "⚠️ Empty input received.", modelUsed: null };
  }

  const intent = classifyIntent(userMessage);
  const order = buildPreferredOrder(intent);

  const available = order.filter(
    (k) => ADAPTERS[k] && hasKey(ADAPTERS[k].key)
  );

  // Publish current score snapshot for the dashboard (even before the run finishes)
  setScores(buildScoreSnapshot());

  trace?.log?.("router.decision", { intent, order: available, stream });

  if (!available.length) {
    const failRun = {
      timestamp: Date.now(),
      intent,
      orderTried: [],
      chosen: null,
      stream,
      success: false,
      latencyMs: 0,
      error: "No providers configured",
    };

    setLastRun({ intent, orderTried: [], chosen: null, stream, success: false });
    recordRun(failRun);
    return { reply: "No AI providers are configured.", modelUsed: null };
  }

  const systemPrompt = executivePacket?.systemPrompt || "You are Cipher OS.";
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

      // STREAM (OpenAI)
      if (stream && entry.supportsStream && entry.streamFn) {
        const out = await entry.streamFn({ ...payload, onToken });
        const reply = extractReply(out) || "";
        const latencyMs = Date.now() - start;

        updateScore(provider, { success: Boolean(reply), latency: latencyMs });
        setScores(buildScoreSnapshot());

        if (reply) {
          const run = {
            timestamp: Date.now(),
            intent,
            orderTried: attempts,
            chosen: provider,
            model: out?.modelUsed || "unknown",
            stream: true,
            success: true,
            latencyMs,
          };

          setLastRun({
            intent,
            orderTried: attempts,
            chosen: provider,
            latencyMs,
            stream: true,
            success: true,
          });
          recordRun(run);

          return { reply, modelUsed: { provider, model: out?.modelUsed || "unknown" } };
        }

        continue;
      }

      // NORMAL (Gemini/Claude/OpenAI fallback)
      const out = await entry.fn(payload);
      const reply = extractReply(out);
      const latencyMs = Date.now() - start;

      updateScore(provider, { success: Boolean(reply), latency: latencyMs });
      setScores(buildScoreSnapshot());

      if (stream && reply) pseudoStream(reply, onToken);

      if (reply) {
        const run = {
          timestamp: Date.now(),
          intent,
          orderTried: attempts,
          chosen: provider,
          model: out?.modelUsed || "unknown",
          stream: Boolean(stream),
          success: true,
          latencyMs,
          pseudoStream: Boolean(stream && !entry.supportsStream),
        };

        setLastRun({
          intent,
          orderTried: attempts,
          chosen: provider,
          latencyMs,
          stream: Boolean(stream),
          success: true,
        });
        recordRun(run);

        return { reply, modelUsed: { provider, model: out?.modelUsed || "unknown" } };
      }
    } catch (err) {
      const latencyMs = Date.now() - start;
      updateScore(provider, { success: false, latency: latencyMs });
      setScores(buildScoreSnapshot());

      trace?.log?.("model.fail", {
        provider,
        latencyMs,
        error: err?.message || String(err),
      });
    }
  }

  const failRun = {
    timestamp: Date.now(),
    intent,
    orderTried: attempts,
    chosen: null,
    stream,
    success: false,
    latencyMs: 0,
    error: "All models failed",
  };

  setLastRun({ intent, orderTried: attempts, chosen: null, stream, success: false });
  recordRun(failRun);

  return { reply: "All models failed to produce a response.", modelUsed: null };
}
