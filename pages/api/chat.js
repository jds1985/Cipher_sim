// pages/api/chat.js
// Cipher OS V0.3 — Multi-model orchestrator + Memory Graph v0 (nodes + summary)

import { runCipherCore } from "../../cipher_core/core.js";
import { loadMemory, saveMemory } from "../../cipher_core/memory";

import { buildOSContext } from "../../cipher_os/runtime/osContext";
import { runOrchestrator } from "../../cipher_os/runtime/orchestrator";
import { createTrace } from "../../cipher_os/runtime/telemetry";

import {
  loadMemoryNodes,
  loadSummary,
  saveSummary,
  logTurn,
} from "../../cipher_os/memory/memoryGraph";

import { updateRollingSummary } from "../../cipher_os/memory/summarizer";
import { writebackFromTurn } from "../../cipher_os/memory/memoryWriteback";

function safeString(x) {
  try {
    return typeof x === "string" ? x : JSON.stringify(x);
  } catch {
    return String(x);
  }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const respond = (reply, meta) => {
    try {
      return res.status(200).json({
        reply: String(reply ?? "…"),
        ...(meta ? { _meta: meta } : {}),
      });
    } catch {
      return res.status(200).end(JSON.stringify({ reply: "…" }));
    }
  };

  if (req.method !== "POST") return respond("Method not allowed.");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 28000);

  const requestId = `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const trace = createTrace(requestId);

  try {
    const body = req.body || {};
    const message = body.message;

    if (!message || typeof message !== "string") {
      clearTimeout(timeoutId);
      return respond("Say something real.");
    }

    const userId = "jim";
    const userName = "Jim";

    let longTermHistory = [];
    try {
      const memoryData = await loadMemory(userId);
      longTermHistory = Array.isArray(memoryData?.history)
        ? memoryData.history
        : [];
      trace.log("memory.load.ok", { count: longTermHistory.length });
    } catch (err) {
      trace.log("memory.load.fail", { error: safeString(err?.message) });
      longTermHistory = [];
    }

    let nodes = [];
    let summaryDoc = { text: "", turns: 0 };

    try {
      nodes = await loadMemoryNodes(userId, 60);
      summaryDoc = await loadSummary(userId);
      trace.log("graph.load.ok", {
        nodes: nodes.length,
        turns: summaryDoc?.turns || 0,
      });
    } catch (err) {
      trace.log("graph.load.fail", { error: safeString(err?.message) });
      nodes = [];
      summaryDoc = { text: "", turns: 0 };
    }

    const osContext = buildOSContext({
      requestId,
      userId,
      userName,
      userMessage: message,
      uiHistory: body.history,
      longTermHistory,
    });

    osContext.memory.nodes = nodes;
    osContext.memory.longTermSummary = String(summaryDoc?.text || "");

    let executivePacket = null;
    try {
      executivePacket = await runCipherCore(
        {
          history: osContext.memory.mergedHistory,
          nodes: osContext.memory.nodes,
          summary: osContext.memory.longTermSummary,
        },
        { userMessage: message, returnPacket: true }
      );
    } catch {
      executivePacket = {
        systemPrompt: "You are Cipher OS. Respond normally.",
      };
    }

    let out = null;
    try {
      out = await runOrchestrator({
        osContext,
        executivePacket,
        signal: controller.signal,
        trace,
      });
    } catch {
      return respond("Cipher orchestration error.");
    }

    const reply = String(out?.reply || "…");

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

    let summaryTurns = Number(summaryDoc?.turns || 0) + 1;

    await writebackFromTurn({
      userId,
      userText: message,
      assistantText: reply,
    });

    if (summaryTurns % 3 === 0) {
      const newSummary = await updateRollingSummary({
        previousSummary: String(summaryDoc?.text || ""),
        recentMessages: osContext.memory.uiHistory.slice(-10),
        signal: controller.signal,
      });
      await saveSummary(userId, newSummary, summaryTurns);
    } else {
      await saveSummary(
        userId,
        String(summaryDoc?.text || ""),
        summaryTurns
      );
    }

    const meta = trace.finish({ modelUsed: out?.modelUsed || null });
    return respond(reply, meta);
  } catch (err) {
    return respond(`Cipher crashed: ${safeString(err?.message)}`);
  }
}
