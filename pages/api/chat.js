export const runtime = "nodejs";
// pages/api/chat.js
// Cipher OS — stable core (Gemini-compatible, hardened)

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const message = req.body?.message?.trim() || "Hello";

    const userId = "jim";
    const userName = "Jim";

    // ── TRACE LOGGER ──────────────────────────────────────
    const trace = {
      log: (event, payload) => {
        console.log(`[TRACE] ${event}`, payload ?? "");
      },
    };

    trace.log("request.received", {
      messageLength: message.length,
    });

    // ── Load long-term memory ─────────────────────────────
    const memoryData = await loadMemory(userId);
    const longTermHistory = memoryData?.history || [];

    trace.log("memory.loaded", {
      longTermTurns: longTermHistory.length,
    });

    // ── Load memory graph ─────────────────────────────────
    const nodes = await loadMemoryNodes(userId, 60);
    const summaryDoc = await loadSummary(userId);

    trace.log("memoryGraph.loaded", {
      nodes: nodes?.length || 0,
      hasSummary: Boolean(summaryDoc?.text),
    });

    // ── Build OS context ──────────────────────────────────
    const osContext = buildOSContext({
      requestId: Date.now().toString(),
      userId,
      userName,
      userMessage: message,
      uiHistory: [],
      longTermHistory,
    });

    osContext.memory.nodes = nodes;
    osContext.memory.longTermSummary = summaryDoc?.text || "";

    trace.log("osContext.built", {
      requestId: osContext.requestId,
    });

    // ── Executive layer ───────────────────────────────────
    const executivePacket = await runCipherCore(
      {
        history: osContext.memory.mergedHistory,
        nodes,
        summary: osContext.memory.longTermSummary,
      },
      { userMessage: message, returnPacket: true }
    );

    trace.log("executive.complete", {
      hasSystemPrompt: Boolean(executivePacket?.systemPrompt),
    });

    // ── Orchestrator ──────────────────────────────────────
    const out = await runOrchestrator({
      osContext,
      executivePacket,
      trace,
    });

    trace.log("orchestrator.complete", {
      modelUsed: out?.modelUsed || null,
    });

    const reply =
      typeof out === "string"
        ? out
        : out?.reply || out?.text || null;

    if (!reply) {
      console.error("❌ Orchestrator returned no reply", out);
      return res.status(500).json({
        error: "Model produced no reply",
      });
    }

    // ── Save memory ───────────────────────────────────────
    await saveMemory(userId, {
      type: "interaction",
      role: "user",
      content: message,
    });

    await saveMemory(userId, {
      type: "interaction",
      role: "assistant",
      content: reply,
    });

    trace.log("memory.saved", {
      userTurnSaved: true,
      assistantTurnSaved: true,
    });

    // ── Memory graph writeback ────────────────────────────
    await writebackFromTurn({
      userId,
      userText: message,
      assistantText: reply,
    });

    trace.log("memoryGraph.writeback", {
      completed: true,
    });

    // ── Update summary ────────────────────────────────────
    const turns = (summaryDoc?.turns || 0) + 1;
    await saveSummary(userId, summaryDoc?.text || "", turns);

    trace.log("summary.updated", {
      turns,
    });

    return res.status(200).json({
      reply,
      model: out?.modelUsed || null, // ⭐ BADGE DATA
    });
  } catch (err) {
    console.error("❌ /api/chat fatal error:", err);
    return res.status(500).json({
      error: err.message || "Chat failed",
    });
  }
}
