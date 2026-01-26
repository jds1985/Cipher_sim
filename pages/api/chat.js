// pages/api/chat.js
// Cipher OS V0 API Route (Phase 1): OS Context -> Executive Layer -> Orchestrator -> Memory writeback

import { runCipherCore } from "../../cipher_core/core";
import { loadMemory, saveMemory } from "../../cipher_core/memory";

import { buildOSContext } from "../../cipher_os/runtime/osContext";
import { runOrchestrator } from "../../cipher_os/runtime/orchestrator";
import { createTrace } from "../../cipher_os/runtime/telemetry";

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

  // Hard timeout for the whole route (prevents hanging “…” forever)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  const requestId = `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const trace = createTrace(requestId);

  try {
    if (!process.env.OPENAI_API_KEY) {
      clearTimeout(timeoutId);
      return respond("Server misconfigured: missing OPENAI_API_KEY.");
    }

    const body = req.body || {};
    const message = body.message;

    if (!message || typeof message !== "string") {
      clearTimeout(timeoutId);
      return respond("Say something real.");
    }

    // TEMP SINGLE USER
    const userId = "jim";
    const userName = "Jim";

    // Long-term memory (fail-open)
    let longTermHistory = [];
    try {
      const memoryData = await loadMemory(userId);
      longTermHistory = Array.isArray(memoryData?.history) ? memoryData.history : [];
      trace.log("memory.load.ok", { count: longTermHistory.length });
    } catch (err) {
      console.error("MEMORY LOAD FAILED:", err);
      trace.log("memory.load.fail", { error: safeString(err?.message) });
      longTermHistory = [];
    }

    // Build OS Context (canonical shape)
    const osContext = buildOSContext({
      requestId,
      userId,
      userName,
      userMessage: message,
      uiHistory: body.history,
      longTermHistory,
    });

    // Executive Layer (Cipher Core) -> structured packet
    let executivePacket = null;
    try {
      executivePacket = await runCipherCore(
        { history: osContext.memory.mergedHistory },
        { userMessage: message, returnPacket: true }
      );
      trace.log("exec.ok", {
        stability: executivePacket?.stability?.score,
        tone: executivePacket?.stability?.tone,
      });
    } catch (err) {
      console.error("CORE FAILED:", err);
      trace.log("exec.fail", { error: safeString(err?.message) });
      executivePacket = {
        systemPrompt: "You are Cipher. Respond normally.",
      };
    }

    // Orchestrator -> model response
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
      console.error("ORCHESTRATOR FAILED:", err);
      trace.log("orch.fail", { error: safeString(err?.message) });
      return respond("Cipher hit an orchestration error. Try again.");
    }

    clearTimeout(timeoutId);

    const reply = String(out?.reply || "…");

    // Memory writeback (fail-open)
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
      console.error("MEMORY SAVE FAILED:", err);
      trace.log("memory.save.fail", { error: safeString(err?.message) });
    }

    const meta = trace.finish({
      modelUsed: out?.modelUsed || null,
    });

    // Optional: comment this out if you don’t want debug metadata in responses
    return respond(reply, meta);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err?.name === "AbortError") return respond("That took too long. Try again.");
    console.error("API HARD CRASH:", err);
    trace.log("api.crash", { error: safeString(err?.message) });
    return respond(`Cipher caught itself. ${safeString(err?.message || "Try again.")}`);
  }
}
