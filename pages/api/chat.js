export const runtime = "nodejs";
// pages/api/chat.js
// Cipher OS — stable core + streaming

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

// gravity
import { runMemoryDecay } from "../../cipher_os/memory/memoryDecay.js";

// extractor
import { extractMemoryFromTurn } from "../../cipher_os/memory/memoryExtractor.js";

// influence
import { buildMemoryInfluence } from "../../cipher_os/runtime/memoryInfluence.js";

function sseWrite(res, obj) {
  res.write(`data: ${JSON.stringify(obj)}\n\n`);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const message = req.body?.message?.trim() || "Hello";
    const wantStream = Boolean(req.body?.stream);

    const userId = "jim";
    const userName = "Jim";

    const trace = {
      log: (event, payload) => console.log(`[TRACE] ${event}`, payload ?? ""),
    };

    trace.log("request.received", { messageLength: message.length, wantStream });

    // ── Load long-term memory ─────────────────────────────
    const memoryData = await loadMemory(userId);
    const longTermHistory = memoryData?.history || [];
    trace.log("memory.loaded", { longTermTurns: longTermHistory.length });

    // ── Load memory graph ─────────────────────────────────
    const nodes = await loadMemoryNodes(userId, 60);
    console.log("🔥 MEMORY NODES LOADED:", nodes?.length);
    const summaryDoc = await loadSummary(userId);

    trace.log("memoryGraph.loaded", {
      nodes: nodes?.length || 0,
      hasSummary: Boolean(summaryDoc?.text),
    });

    // ── Build OS context (NOW WITH WEIGHT ENGINE) ────────
    const osContext = buildOSContext({
      requestId: Date.now().toString(),
      userId,
      userName,
      userMessage: message,
      uiHistory: [],
      longTermHistory,
      memoryNodes: nodes, // ⭐ IMPORTANT
    });

    osContext.memory.longTermSummary = summaryDoc?.text || "";

    trace.log("osContext.built", { requestId: osContext.requestId });

    // ── Executive layer ───────────────────────────────────
    const executivePacket = await runCipherCore(
      {
        history: osContext.memory.mergedHistory,
        nodes: osContext.memory.nodes, // ⭐ use filtered nodes
        summary: osContext.memory.longTermSummary,
      },
      { userMessage: message, returnPacket: true }
    );

    trace.log("executive.complete", {
      hasSystemPrompt: Boolean(executivePacket?.systemPrompt),
    });

    // ⭐⭐⭐ APPLY INFLUENCE ⭐⭐⭐
    const influenceText = buildMemoryInfluence(osContext.memory.nodes);

    if (influenceText) {
      executivePacket.systemPrompt =
        (executivePacket.systemPrompt || "") + "\n" + influenceText;
    }

    trace.log("memory.influence", { applied: Boolean(influenceText) });

    // ──────────────────────────────────────────────────────
    // STREAM MODE
    // ──────────────────────────────────────────────────────
    if (wantStream) {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      const heartbeat = setInterval(() => {
        try {
          res.write(`: ping\n\n`);
        } catch {}
      }, 15000);

      let streamedText = "";

      sseWrite(res, { type: "meta", ok: true });

      const out = await runOrchestrator({
        osContext,
        executivePacket,
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
      });

      clearInterval(heartbeat);

      const finalReply = out?.reply || streamedText || "";

      await saveMemory(userId, { type: "interaction", role: "user", content: message });
      await saveMemory(userId, {
        type: "interaction",
        role: "assistant",
        content: finalReply,
      });

      trace.log("memory.saved", { userTurnSaved: true, assistantTurnSaved: true });

      const extracted = extractMemoryFromTurn(message, finalReply);

      await writebackFromTurn({
        userId,
        userText: message,
        assistantText: finalReply,
        extracted,
      });

      trace.log("memoryGraph.writeback", { completed: true });

      await runMemoryDecay(userId);
      trace.log("memory.decay.complete");

      const turns = (summaryDoc?.turns || 0) + 1;
      await saveSummary(userId, summaryDoc?.text || "", turns);
      trace.log("summary.updated", { turns });

      res.end();
      return;
    }

    // ──────────────────────────────────────────────────────
    // NORMAL MODE
    // ──────────────────────────────────────────────────────
    const out = await runOrchestrator({
      osContext,
      executivePacket,
      trace,
    });

    const reply =
      typeof out === "string" ? out : out?.reply || out?.text || null;

    if (!reply) {
      console.error("❌ Orchestrator returned no reply", out);
      return res.status(500).json({ error: "Model produced no reply" });
    }

    const model =
      out?.modelUsed?.model ||
      out?.model ||
      out?.engine ||
      null;

    await saveMemory(userId, { type: "interaction", role: "user", content: message });
    await saveMemory(userId, {
      type: "interaction",
      role: "assistant",
      content: reply,
    });

    trace.log("memory.saved", { userTurnSaved: true, assistantTurnSaved: true });

    const extracted = extractMemoryFromTurn(message, reply);

    await writebackFromTurn({
      userId,
      userText: message,
      assistantText: reply,
      extracted,
    });

    trace.log("memoryGraph.writeback", { completed: true });

    await runMemoryDecay(userId);
    trace.log("memory.decay.complete");

    const turns = (summaryDoc?.turns || 0) + 1;
    await saveSummary(userId, summaryDoc?.text || "", turns);
    trace.log("summary.updated", { turns });

    return res.status(200).json({ reply, model });
  } catch (err) {
    console.error("❌ /api/chat fatal error:", err);
    return res.status(500).json({ error: err.message || "Chat failed" });
  }
}
