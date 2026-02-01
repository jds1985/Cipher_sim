// pages/api/chat.js
// Cipher OS V0.3 — Multi-model orchestrator + Memory Graph v0 (nodes + summary)

import { runCipherCore } from "../../cipher_core/core.js";
import { loadMemory, saveMemory } from "../../cipher_core/memory.js";

import { buildOSContext } from "../../cipher_os/runtime/osContext.js";
import { runOrchestrator } from "../../cipher_os/runtime/orchestrator.js";
import { createTrace } from "../../cipher_os/runtime/telemetry.js";

import {
  loadMemoryNodes,
  loadSummary,
  saveSummary,
  logTurn,
} from "../../cipher_os/memory/memoryGraph.js";

import { updateRollingSummary } from "../../cipher_os/memory/summarizer.js";
import { writebackFromTurn } from "../../cipher_os/memory/memoryWriteback.js";

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
    } catch {
      longTermHistory = [];
    }

    let nodes = [];
    let summaryDoc = { text: "", turns: 0 };

    try {
      nodes = await loadMemoryNodes(userId, 60);
      summaryDoc = await loadSummary(userId);
    } catch {
      nodes = [];
      summaryDoc = { text: "", turns: 0 };
    }

    const osContext = buildOSContext({
      requestId,
      userId,
      userName,
      userMessage: message,
      uiHistory: body.history || [],
      longTermHistory,
    });

    osContext.memory.nodes = nodes;
    osContext.memory.longTermSummary = String(summaryDoc?.text || "");

    let executivePacket;
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

    let out;
    try {
      out = await runOrchestrator({
        osContext,
        executivePacket,
        signal: controller.signal,
        trace,
      });
    } catch {
      clearTimeout(timeoutId);
      return respond("Cipher orchestration error.");
    }

    clearTimeout(timeoutId);
    const reply = String(out?.reply || "…");

    try {
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
    } catch {}

    let summaryTurns = Number(summaryDoc?.turns || 0) + 1;

    try {
      await writebackFromTurn({
        userId,
        userText: message,
        assistantText: reply,
      });
    } catch {}

    try {
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
    } catch {}

    try {
      await logTurn(userId, {
        requestId,
        modelUsed: out?.modelUsed || null,
        userText: message.slice(0, 400),
        assistantText: reply.slice(0, 400),
        nodesCount: nodes.length,
        summaryTurns,
      });
    } catch {}

    const meta = trace.finish({ modelUsed: out?.modelUsed || null });
    return respond(reply, meta);
  } catch (err) {
    clearTimeout(timeoutId);
    return respond("Cipher crashed: " + safeString(err?.message));
  }
}
