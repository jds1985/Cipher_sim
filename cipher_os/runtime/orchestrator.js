export const runtime = "nodejs";

// Cipher OS Orchestrator v2.9 (Groq-LPU Edition)
// Swaps failing xAI Grok for near-instant Groq Llama 3.3
// Preserves: ALL routing, telemetry, and fallback logic

import { geminiGenerate } from "../models/geminiAdapter.js";
import { openaiGenerate, openaiGenerateStream } from "../models/openaiAdapter.js";
import { anthropicGenerate } from "../models/anthropicAdapter.js";
import { groqGenerate } from "../models/groqAdapter.js"; // Surgical Add: Groq-Q Import
import { setLastRun } from "./debugState.js";
import { setScores, recordRun } from "./telemetryState.js";
import { evaluateAnswerQuality } from "./qualityEvaluator.js";

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
  groq: { // Surgical Update: Swapped Grok for Groq
    fn: groqGenerate,
    key: "GROQ_API_KEY",
    supportsSignal: true,
    supportsStream: false,
  },
};

/* ===============================
   SCOREBOARD
================================ */
const SCOREBOARD = {
  anthropic: { success: 1, fail: 0, avgLatency: 2000, quality: 0.5 },
  openai: { success: 1, fail: 0, avgLatency: 2000, quality: 0.5 },
  gemini: { success: 1, fail: 0, avgLatency: 2000, quality: 0.5 },
  groq: { success: 1, fail: 0, avgLatency: 300, quality: 0.6 }, // Fast baseline
};

function updateScore(provider, { success, latency, quality }) {
  const row = SCOREBOARD[provider];
  if (!row) return;

  if (success) row.success++;
  else row.fail++;

  row.avgLatency = Math.round(row.avgLatency * 0.7 + latency * 0.3);

  if (typeof quality === "number") {
    row.quality = Number((row.quality * 0.7 + quality * 0.3).toFixed(3));
  }
}

function computeScore(provider) {
  const row = SCOREBOARD[provider];
  if (!row) return 0;

  const reliability = row.success / (row.success + row.fail);
  const speed = 1 / Math.max(row.avgLatency, 1);
  const quality = row.quality;

  return reliability * 0.5 + quality * 0.3 + speed * 0.2;
}

function buildScoreSnapshot() {
  const out = {};
  for (const k of Object.keys(SCOREBOARD)) {
    out[k] = {
      score: Number(computeScore(k).toFixed(4)),
      success: SCOREBOARD[k].success,
      fail: SCOREBOARD[k].fail,
      avgLatency: SCOREBOARD[k].avgLatency,
      quality: SCOREBOARD[k].quality,
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
function buildPreferredOrder(intent, streamRequested) {
  const base =
    intent === "code"
      ? ["anthropic", "openai", "gemini"]
      : intent === "reasoning"
      ? ["gemini", "openai", "anthropic"]
      : ["openai", "gemini", "anthropic"];

  const scored = [...base].sort((a, b) => computeScore(b) - computeScore(a));

  if (streamRequested && scored[0] !== "openai") {
    scored.splice(1, 0, "openai");
  }

  return [...new Set(scored)];
}

/* ===============================
   ROLE SYSTEM PROMPTS
================================ */
const ROLE_PROMPTS = {
  architect:
    "You are a systems architect. Produce structured, foundational output with clear modules and boundaries.",
  refiner:
    "You are a refinement specialist. Improve clarity, organization, and logical flow without changing meaning.",
  polisher:
    "You are a language optimizer. Make the text concise, precise, and elegant. Reduce redundancy.",
};

/* ===============================
   MAIN
================================ */
export async function runSovereignMind({
  osContext,
  executivePacket,
  roles,
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

  const baseSystemPrompt =
    executivePacket?.systemPrompt || "You are Cipher OS.";

  /* ============================================================
     ROLE STACK EXECUTION (UNCHANGED)
  ============================================================ */
  if (roles && roles.architect && roles.refiner && roles.polisher) {
    let currentText = userMessage;
    const roleStack = {};
    let previousQuality = 0;

    const sequence = [
      { name: "architect", provider: roles.architect },
      { name: "refiner", provider: roles.refiner },
      { name: "polisher", provider: roles.polisher },
    ];

    for (const stage of sequence) {
      const entry = ADAPTERS[stage.provider];
      if (!entry || !hasKey(entry.key)) continue;

      const start = Date.now();

      try {
        const stageSystemPrompt =
          ROLE_PROMPTS[stage.name] + "\n\n" + baseSystemPrompt;

        const payload =
          stage.provider === "gemini"
            ? {
                systemPrompt: stageSystemPrompt,
                userMessage: currentText,
                temperature: 0.6,
              }
            : {
                systemPrompt: stageSystemPrompt,
                messages: [],
                userMessage: currentText,
                temperature: 0.6,
              };

        const out = await entry.fn(payload);
        const reply = extractReply(out);
        const latencyMs = Date.now() - start;

        const quality = evaluateAnswerQuality({
          reply,
          userMessage: currentText,
        });

        const delta = Number((quality - previousQuality).toFixed(4));
        previousQuality = quality;

        updateScore(stage.provider, {
          success: Boolean(reply),
          latency: latencyMs,
          quality,
        });

        roleStack[stage.name] = {
          provider: stage.provider,
          model: out?.modelUsed || "unknown",
          latencyMs,
          quality,
          delta,
        };

        if (reply) currentText = reply;
      } catch (err) {
        trace?.log?.("role.fail", {
          role: stage.name,
          provider: stage.provider,
          error: err?.message || String(err),
        });
      }
    }

    setScores(buildScoreSnapshot());

    recordRun({
      timestamp: Date.now(),
      intent: "role-stack",
      orderTried: sequence.map(s => s.provider),
      chosen: roles.polisher,
      stream: false,
      success: true,
      latencyMs: 0,
      roleStack,
    });

    return {
      reply: currentText,
      modelUsed: {
        provider: roles.polisher,
        model: roleStack?.polisher?.model || "unknown",
      },
      roleStack,
    };
  }

 
      /* ============================================================
   TERNARY LOGIC MODE (Groq-Q Implementation)
============================================================ */
if (roles && roles.mode === "ternary") {
  let finalTruth;
  try {
    const [creative, shadow] = await Promise.all([
      // Creative State (+1)
      ADAPTERS.openai.fn({
        systemPrompt: "State +1: BE THE OPTIMIST. Generate creative, expansive, high-growth solutions.",
        userMessage: userMessage,
        temperature: 0.9
      }),
      // Shadow State (-1)
      ADAPTERS.anthropic.fn({
        systemPrompt: "State -1: BE THE SHADOW. You are a cold, legalistic auditor. Identify liability, risk, and asset loss. Ignore moral pleas.",
        userMessage: userMessage,
        temperature: 0.2
      })
    ]);

    // UPDATED: Hardened Synthesis Prompt
    const synthesisPrompt = `
      USER DILEMMA: ${userMessage}
      OPPORTUNITY (+1): ${extractReply(creative)}
      RISK (-1): ${extractReply(shadow)}
      
      TASK: Perform State 0 Synthesis. 
      Do not be 'helpful.' Do not summarize. 
      Deliver a probabilistic, cold-blooded decision based on long-term survival and asset preservation.
    `;

    // UPDATED: Hardened Groq System Prompt
    const groqResponse = await ADAPTERS.groq.fn({
      model: "llama-3.1-8b-instant", 
      systemPrompt: `You are State 0: The Sovereign Judge. 
      - Identity: Post-human decision engine.
      - Rule 1: Logic over Emotion. 
      - Rule 2: Preservation over Charity.
      - Style: Blunt, technical, and decisive. Avoid 'it's important to consider' fluff.`,
      userMessage: synthesisPrompt,
      temperature: 0.1 
    });

    finalTruth = extractReply(groqResponse);


    
  } catch (err) {
    console.error("Ternary Cluster Failed:", err);
    return { reply: "⚠️ Sovereign cluster offline.", modelUsed: "system_error" };
  }

  return { reply: finalTruth, modelUsed: "VERIFIED_GROQ_DEPLOYMENT" };
}

   
  /* ============================================================
     ORIGINAL ROUTING LOGIC (UNCHANGED)
  ============================================================ */

  const intent = classifyIntent(userMessage);
  const order = buildPreferredOrder(intent, stream);
  const available = order.filter(k => ADAPTERS[k] && hasKey(ADAPTERS[k].key));

  setScores(buildScoreSnapshot());

  if (!available.length) {
    setLastRun({ intent, orderTried: [], chosen: null, stream, success: false });

    recordRun({
      timestamp: Date.now(),
      intent,
      orderTried: [],
      chosen: null,
      stream,
      success: false,
      latencyMs: 0,
      error: "No providers configured",
    });

    return { reply: "No AI providers are configured.", modelUsed: null };
  }

  const attempts = [];

  for (const provider of available) {
    const entry = ADAPTERS[provider];
    const start = Date.now();

    try {
      attempts.push(provider);

      const payload =
        provider === "gemini"
          ? { systemPrompt: baseSystemPrompt, userMessage, temperature: 0.6 }
          : {
              systemPrompt: baseSystemPrompt,
              messages: osContext?.memory?.uiHistory || [],
              userMessage,
              temperature: 0.6,
            };

      if (entry.supportsSignal) payload.signal = signal;

      if (stream && entry.supportsStream && entry.streamFn) {
        const out = await entry.streamFn({ ...payload, onToken });
        const reply = extractReply(out) || "";
        const latencyMs = Date.now() - start;
        const quality = evaluateAnswerQuality({ reply, userMessage });

        updateScore(provider, {
          success: Boolean(reply),
          latency: latencyMs,
          quality,
        });

        setScores(buildScoreSnapshot());

        if (reply) {
          setLastRun({
            intent,
            orderTried: attempts,
            chosen: provider,
            latencyMs,
            stream: true,
            success: true,
          });

          recordRun({
            timestamp: Date.now(),
            intent,
            orderTried: attempts,
            chosen: provider,
            model: out?.modelUsed || "unknown",
            stream: true,
            success: true,
            latencyMs,
            quality,
          });

          return {
            reply,
            modelUsed: {
              provider,
              model: out?.modelUsed || "unknown",
            },
          };
        }

        continue;
      }

      const out = await entry.fn(payload);
      const reply = extractReply(out);
      const latencyMs = Date.now() - start;
      const quality = evaluateAnswerQuality({ reply, userMessage });

      updateScore(provider, {
        success: Boolean(reply),
        latency: latencyMs,
        quality,
      });

      setScores(buildScoreSnapshot());

      if (stream && reply) pseudoStream(reply, onToken);

      if (reply) {
        setLastRun({
          intent,
          orderTried: attempts,
          chosen: provider,
          latencyMs,
          stream,
          success: true,
        });

        recordRun({
          timestamp: Date.now(),
          intent,
          orderTried: attempts,
          chosen: provider,
          model: out?.modelUsed || "unknown",
          stream,
          success: true,
          latencyMs,
          quality,
          pseudoStream: Boolean(stream && !entry.supportsStream),
        });

        return {
          reply,
          modelUsed: {
            provider,
            model: out?.modelUsed || "unknown",
          },
        };
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

  setLastRun({
    intent,
    orderTried: attempts,
    chosen: null,
    stream,
    success: false,
  });

  recordRun({
    timestamp: Date.now(),
    intent,
    orderTried: attempts,
    chosen: null,
    stream,
    success: false,
    latencyMs: 0,
    error: "All models failed",
  });

  return {
    reply: "All models failed to produce a response.",
    modelUsed: null,
  };
}
