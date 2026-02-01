// pages/api/chat.js
// Cipher OS V0.3 — Multi-model orchestrator + Memory Graph v0 (nodes + summary)

import { runCipherCore } from "../../cipher_core/core";
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

    // TEMP SINGLE USER
    const userId = "jim";
    const userName = "Jim";

    // 1) Load existing long-term chat memory (your existing system)
    let longTermHistory = [];
    try {
      const memoryData = await loadMemory(userId);
      longTermHistory = Array.isArray(memoryData?.history) ? memoryData.history : [];
      trace.log("memory.load.ok", { count: longTermHistory.length });
    } catch (err) {
      trace.log("memory.load.fail", { error: safeString(err?.message) });
      longTermHistory = [];
    }

    // 2) Load Memory Graph v0 (nodes + summary)
    let nodes = [];
    let summaryDoc = { text: "", turns: 0 };

    try {
      nodes = await loadMemoryNodes(userId, 60);
      summaryDoc = await loadSummary(userId);
      trace.log("graph.load.ok", { nodes: nodes.length, turns: summaryDoc?.turns || 0 });
    } catch (err) {
      trace.log("graph.load.fail", { error: safeString(err?.message) });
      nodes = [];
      summaryDoc = { text: "", turns: 0 };
    }

    // 3) Build OS Context
    const osContext = buildOSContext({
      requestId,
      userId,
      userName,
      userMessage: message,
      uiHistory: body.history,
      longTermHistory,
    });

    // Inject graph memory into context
    osContext.memory.nodes = nodes;
    osContext.memory.longTermSummary = String(summaryDoc?.text || "");

    // 4) Executive Layer builds system prompt using history + nodes + summary
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
      trace.log("exec.ok", {
        stability: executivePacket?.stability?.score,
        tone: executivePacket?.stability?.tone,
      });
    } catch (err) {
      trace.log("exec.fail", { error: safeString(err?.message) });
      executivePacket = { systemPrompt: "You are Cipher OS. Respond normally." };
    }

    // 5) Orchestrator -> response (OpenAI/Claude/Gemini)
    let out = null;
    try {
      out = await runOrchestrator({
        osContext,
        executivePacket,
        signal: controller.signal,
        trace,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (err?.name === "AbortError") return respond("That took too long. Try again.");
      trace.log("orch.fail", { error: safeString(err?.message) });
      return respond("Cipher hit an orchestration error. Try again.");
    }

    clearTimeout(timeoutId);

    const reply = String(out?.reply || "…");

    // 6) Existing memory log writeback (fail-open)
    try {
      await saveMemory(userId, {
        type: "interaction",
        role: "user",
        content: message,
        importance: "medium",
      });

      await saveMemory(userId, {
        type: "interaction",
        role: "assistant",
        content: reply,
        importance: "medium",
      });

      trace.log("memory.save.ok", { wrote: 2 });
    } catch (err) {
      trace.log("memory.save.fail", { error: safeString(err?.message) });
    }

    // 7) Memory Graph v0 writeback: nodes + rolling summary
    let summaryTurns = Number(summaryDoc?.turns || 0);
    summaryTurns += 1;

    // (a) Write nodes for high signal
    try {
      const nodeOut = await writebackFromTurn({
        userId,
        userText: message,
        assistantText: reply,
      });
      trace.log("graph.nodes.ok", nodeOut);
    } catch (err) {
      trace.log("graph.nodes.fail", { error: safeString(err?.message) });
    }

    // (b) Update rolling summary every 3 turns (cheap + effective)
    try {
      const shouldSummarize = summaryTurns % 3 === 0;

      if (shouldSummarize) {
        const newSummary = await updateRollingSummary({
          previousSummary: String(summaryDoc?.text || ""),
          recentMessages: osContext.memory.uiHistory.slice(-10),
          signal: controller.signal,
        });

        await saveSummary(userId, newSummary, summaryTurns);
        trace.log("graph.summary.ok", { summarized: true, turns: summaryTurns });
      } else {
        await saveSummary(userId, String(summaryDoc?.text || ""), summaryTurns);
        trace.log("graph.summary.ok", { summarized: false, turns: summaryTurns });
      }
    } catch (err) {
      trace.log("graph.summary.fail", { error: safeString(err?.message) });
    }

    // (c) Optional turn log (debuggable)
    try {
      await logTurn(userId, {
        requestId,
        modelUsed: out?.modelUsed || null,
        userText: message.slice(0, 400),
        assistantText: reply.slice(0, 400),
        nodesCount: Array.isArray(nodes) ? nodes.length : 0,
        summaryTurns,
      });
    } catch {
      // ignore
    }

    const meta = trace.finish({ modelUsed: out?.modelUsed || null });

    return respond(reply, meta);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err?.name === "AbortError") return respond("That took too long. Try again.");
    trace.log("api.crash", { error: safeString(err?.message) });
    return respond(`Cipher caught itself. ${safeString(err?.message || "Try again.")}`);
  }
}
