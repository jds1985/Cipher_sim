export const runtime = "nodejs";
// pages/api/chat.js
// Cipher OS — stable core + streaming + memory visibility + tier-safe role handling

import { runCipherCore } from "../../cipher_core/core.js";
import { loadMemory, saveMemory } from "../../cipher_core/memory.js";

import { buildOSContext } from "../../cipher_os/runtime/osContext.js";
import { runOrchestrator } from "../../cipher_os/runtime/orchestrator.js";

import {
  loadMemoryNodes,
  loadSummary,
  saveSummary,
} from "../../cipher_os/memory/memoryGraph.js";

import { writebackFromTurn } from "../../cipher_os/memory/memoryWriteback.js";
import { runMemoryDecay } from "../../cipher_os/memory/memoryDecay.js";
import { extractMemoryFromTurn } from "../../cipher_os/memory/memoryExtractor.js";
import { buildMemoryInfluence } from "../../cipher_os/runtime/memoryInfluence.js";
import { prioritizeContext } from "../../cipher_os/runtime/contextPrioritizer.js";

function sseWrite(res, obj) {
  res.write(`data: ${JSON.stringify(obj)}\n\n`);
}

function exposeMemory(nodes = []) {
  return (nodes || []).map((n) => ({
    id: n?.id || n?.docId || null,
    type: n?.type || "unknown",
    importance: Number.isFinite(n?.importance) ? n.importance : 0,
    locked: Boolean(n?.locked),
    preview: (n?.content || n?.text || "").slice(0, 120),
  }));
}

function clampRolesByTier(roles, tier) {
  const safe = roles && roles.architect && roles.refiner && roles.polisher ? roles : null;
  if (!safe) return null;

  if (tier === "free") {
    // Free: single model only (Decipher is a UI feature, not multi-model routing)
    return { architect: "openai", refiner: "openai", polisher: "openai" };
  }

  if (tier === "pro") {
    // Pro: allow up to 2 unique models
    const vals = [safe.architect, safe.refiner, safe.polisher];
    const uniq = Array.from(new Set(vals));
    if (uniq.length <= 2) return safe;
    // clamp: force polisher to match refiner
    return { ...safe, polisher: safe.refiner };
  }

  // Builder: allow 3 unique
  return safe;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const message = req.body?.message?.trim() || "Hello";
    const wantStream = Boolean(req.body?.stream);

    const tier = (req.body?.tier || "free").toLowerCase();
    const requestedRoles = req.body?.roles || null;
    const roles = clampRolesByTier(requestedRoles, tier);

    // NOTE: you can swap this later for auth-based IDs
    const userId = "jim";
    const userName = "Jim";

    const trace = {
      log: (event, payload) => console.log(`[TRACE] ${event}`, payload ?? ""),
    };

    // ── Load memory ─────────────────────────────
    const memoryData = await loadMemory(userId);
    const longTermHistory = memoryData?.history || [];

    const nodes = await loadMemoryNodes(userId, 60);
    const summaryDoc = await loadSummary(userId);

    const prioritizedNodes = prioritizeContext(nodes || [], 15);

    const osContext = buildOSContext({
      requestId: Date.now().toString(),
      userId,
      userName,
      userMessage: message,
      uiHistory: [],
      longTermHistory,
      memoryNodes: prioritizedNodes,
    });

    osContext.memory.nodes = prioritizedNodes;
    osContext.memory.longTermSummary = summaryDoc?.text || "";

    const executivePacket = await runCipherCore(
      {
        history: osContext.memory.mergedHistory,
        nodes: prioritizedNodes,
        summary: osContext.memory.longTermSummary,
      },
      { userMessage: message, returnPacket: true }
    );

    // ── Memory influence ─────────────────────────
    const influenceText = buildMemoryInfluence(prioritizedNodes);
    if (influenceText) {
      executivePacket.systemPrompt =
        (executivePacket.systemPrompt || "") + "\n" + influenceText;
    }

    // ── Tiny greeting clamp (prevents “essay on hey”) ──
    const raw = message.trim();
    const tinyGreeting = /^(hi|hey|yo|hello|sup)$/i.test(raw);
    const isTiny = raw.length <= 10 && !/[?.!]/.test(raw);

    if (tinyGreeting || isTiny) {
      executivePacket.systemPrompt =
        (executivePacket.systemPrompt || "") +
        "\nIf the user input is a simple greeting or very short message, reply in 1-2 short sentences and ask one simple follow-up question at most.";
    }

    // ─────────────────────────────────────────────
    // STREAM MODE
    // ─────────────────────────────────────────────
    // IMPORTANT FIX:
    // Streaming cannot run role-stack yet. Also, your client always sends roles,
    // so we IGNORE roles during stream to avoid 400 errors and broken UX.
    if (wantStream) {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      let streamedText = "";

      const out = await runOrchestrator({
        osContext,
        executivePacket,
        roles: null, // <-- key: keep stream stable + fast
        trace,
        stream: true,
        onToken: (delta) => {
          streamedText += delta;
          sseWrite(res, { type: "delta", text: delta });
        },
      });

      sseWrite(res, {
        type: "done",
        reply: out?.reply || streamedText || "",
        model: out?.modelUsed?.model || null,
        provider: out?.modelUsed?.provider || null,
        roleStack: null,
        memoryInfluence: exposeMemory(prioritizedNodes),
      });

      res.end();
      return;
    }

    // ─────────────────────────────────────────────
    // NORMAL MODE
    // ─────────────────────────────────────────────
    const out = await runOrchestrator({
      osContext,
      executivePacket,
      roles: roles, // only applies in non-stream mode
      trace,
    });

    const reply =
      typeof out === "string" ? out : out?.reply || out?.text || null;

    if (!reply) {
      return res.status(500).json({ error: "Model produced no reply" });
    }

    const model =
      out?.modelUsed?.model || out?.model || out?.engine || null;

    await saveMemory(userId, { type: "interaction", role: "user", content: message });
    await saveMemory(userId, { type: "interaction", role: "assistant", content: reply });

    const extracted = extractMemoryFromTurn(message, reply);

    await writebackFromTurn({
      userId,
      userText: message,
      assistantText: reply,
      extracted,
    });

    await runMemoryDecay(userId);

    const turns = (summaryDoc?.turns || 0) + 1;
    await saveSummary(userId, summaryDoc?.text || "", turns);

    return res.status(200).json({
      reply,
      model,
      roleStack: out?.roleStack || null,
      memoryInfluence: exposeMemory(prioritizedNodes),
    });
  } catch (err) {
    console.error("❌ /api/chat fatal error:", err);
    return res.status(500).json({ error: err.message || "Chat failed" });
  }
}
