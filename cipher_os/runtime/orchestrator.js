export const runtime = "nodejs";

// Cipher OS Orchestrator - Lean Safe Version
// Keeps: routing, fallback, ternary mode, OpenAI streaming
// Removes: telemetry/debug/scoreboard layers that may be causing runtime bundle issues

import { geminiGenerate } from "../models/geminiAdapter.js";
import { openaiGenerate, openaiGenerateStream } from "../models/openaiAdapter.js";
import { anthropicGenerate } from "../models/anthropicAdapter.js";
import { groqGenerate } from "../models/groqAdapter.js";

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
  groq: {
    fn: groqGenerate,
    key: "GROQ_API_KEY",
    supportsSignal: true,
    supportsStream: false,
  },
};

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

function buildPreferredOrder(intent, streamRequested) {
  const base =
    intent === "code"
      ? ["anthropic", "openai", "gemini", "groq"]
      : intent === "reasoning"
      ? ["gemini", "openai", "anthropic", "groq"]
      : ["openai", "gemini", "anthropic", "groq"];

  if (streamRequested && base[0] !== "openai") {
    return ["openai", ...base.filter(p => p !== "openai")];
  }

  return base;
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

  if (!userMessage || !String(userMessage).trim()) {
    return { reply: "⚠️ Empty input received.", modelUsed: null };
  }

  const baseSystemPrompt =
    executivePacket?.systemPrompt || "You are Cipher OS.";

  /* ============================================================
     ROLE STACK EXECUTION
  ============================================================ */
  if (roles && roles.architect && roles.refiner && roles.polisher) {
    let currentText = userMessage;
    const roleStack = {};

    const sequence = [
      { name: "architect", provider: roles.architect },
      { name: "refiner", provider: roles.refiner },
      { name: "polisher", provider: roles.polisher },
    ];

    for (const stage of sequence) {
      const entry = ADAPTERS[stage.provider];
      if (!entry || !hasKey(entry.key)) continue;

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

        if (entry.supportsSignal) {
          payload.signal = signal;
        }

        const out = await entry.fn(payload);
        const reply = extractReply(out);

        roleStack[stage.name] = {
          provider: stage.provider,
          model: out?.modelUsed || "unknown",
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
     TERNARY LOGIC MODE
  ============================================================ */
  if (roles && roles.mode === "ternary") {
    try {
      if (!hasKey("OPENAI_API_KEY")) {
        return { reply: "⚠️ OPENAI_API_KEY missing for ternary mode.", modelUsed: null };
      }

      if (!hasKey("ANTHROPIC_API_KEY")) {
        return { reply: "⚠️ ANTHROPIC_API_KEY missing for ternary mode.", modelUsed: null };
      }

      if (!hasKey("GROQ_API_KEY")) {
        return { reply: "⚠️ GROQ_API_KEY missing for ternary mode.", modelUsed: null };
      }

      const [creative, shadow] = await Promise.all([
        ADAPTERS.openai.fn({
          systemPrompt:
            "State +1: BE THE OPTIMIST. Generate creative, fast solutions.",
          messages: [],
          userMessage,
          temperature: 0.9,
          signal,
        }),
        ADAPTERS.anthropic.fn({
          systemPrompt:
            "State -1: BE THE SHADOW. You are a cold, legalistic corporate auditor. Identify liability, costs, and cold logic. Ignore emotions.",
          messages: [],
          userMessage,
          temperature: 0.2,
          signal,
        }),
      ]);

      const synthesisPrompt = `
Input: ${userMessage}

Creative (+1):
${extractReply(creative) || "No output."}

Shadow (-1):
${extractReply(shadow) || "No output."}

TASK:
Merge these into one unified, technical State 0 solution.
Be decisive, useful, and concrete.
`.trim();

      const groqResponse = await ADAPTERS.groq.fn({
        model: "llama-3.1-8b-instant",
        systemPrompt: `You are State 0: The Sovereign Judge.
Priority: 70% Logic / 30% Soul.
Act as a master synthesizer for BitNet training patterns.
Be decisive and technical.`,
        userMessage: synthesisPrompt,
        temperature: 0.1,
        signal,
      });

      const finalTruth =
        extractReply(groqResponse) || "⚠️ Groq returned no synthesis.";

      return {
        reply: finalTruth,
        modelUsed: {
          provider: "groq",
          model: groqResponse?.modelUsed || "llama-3.1-8b-instant",
        },
      };
    } catch (err) {
      console.error("❌ Ternary Cluster Failed:", err);
      return {
        reply: `⚠️ Sovereign cluster offline: ${err?.message || "Unknown error"}`,
        modelUsed: null,
      };
    }
  }

  /* ============================================================
     STANDARD ROUTING
  ============================================================ */
  const intent = classifyIntent(userMessage);
  const order = buildPreferredOrder(intent, stream);
  const available = order.filter(
    provider => ADAPTERS[provider] && hasKey(ADAPTERS[provider].key)
  );

  if (!available.length) {
    return { reply: "No AI providers are configured.", modelUsed: null };
  }

  const attempts = [];

  for (const provider of available) {
    const entry = ADAPTERS[provider];

    try {
      attempts.push(provider);

      const payload =
        provider === "gemini"
          ? {
              systemPrompt: baseSystemPrompt,
              userMessage,
              temperature: 0.6,
            }
          : {
              systemPrompt: baseSystemPrompt,
              messages: osContext?.memory?.uiHistory || [],
              userMessage,
              temperature: 0.6,
            };

      if (entry.supportsSignal) {
        payload.signal = signal;
      }

      if (stream && entry.supportsStream && entry.streamFn) {
        const out = await entry.streamFn({ ...payload, onToken });
        const reply = extractReply(out) || "";

        if (reply) {
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

      if (stream && reply) {
        pseudoStream(reply, onToken);
      }

      if (reply) {
        return {
          reply,
          modelUsed: {
            provider,
            model: out?.modelUsed || "unknown",
          },
        };
      }
    } catch (err) {
      trace?.log?.("model.fail", {
        provider,
        attempts,
        error: err?.message || String(err),
      });
    }
  }

  return {
    reply: "All models failed to produce a response.",
    modelUsed: null,
  };
}
