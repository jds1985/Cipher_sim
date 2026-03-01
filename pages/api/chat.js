export const runtime = "nodejs";
// pages/api/chat.js
// Cipher OS — stable core + streaming + memory visibility + Role Mode

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

/* ─────────────────────────────────────────────
   ROLE MODE PIPELINE
───────────────────────────────────────────── */

async function runRolePipeline({
  roles,
  osContext,
  executivePacket,
  trace,
}) {
  const { architect, refiner, polisher } = roles;

  let stageSystemPrompt = executivePacket.systemPrompt || "";
  let stageReply = null;
  let lastModelUsed = null;

  // helper to override model inside orchestrator
  const runStage = async (overrideModel, injectedPrompt) => {
    const stageExecutive = {
      ...executivePacket,
      systemPrompt: stageSystemPrompt + "\n" + injectedPrompt,
      forceModel: overrideModel || null,
    };

    const out = await runOrchestrator({
      osContext,
      executivePacket: stageExecutive,
      trace,
    });

    const reply =
      typeof out === "string" ? out : out?.reply || out?.text || null;

    if (!reply) throw new Error("Role stage produced no reply");

    lastModelUsed = out?.modelUsed || null;
    return reply;
  };

  // ── ARCHITECT ──
  stageReply = await runStage(
    architect,
    `You are the Architect.
Generate the best possible response to the user request.
Be thorough, structured, and intelligent.`
  );

  // ── REFINER ──
  if (refiner) {
    stageReply = await runStage(
      refiner,
      `You are the Refiner.
Improve clarity, structure, and reasoning.
Do not change meaning unless absolutely necessary.

Original Response:
${stageReply}`
    );
  }

  // ── POLISHER ──
  if (polisher) {
    stageReply = await runStage(
      polisher,
      `You are the Polisher.
Improve tone, formatting, and readability.
Do not alter the core meaning.

Text:
${stageReply}`
    );
  }

  return {
    reply: stageReply,
    modelUsed: lastModelUsed,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("ROLES:", req.body.roles);
  try {
    const message = req.body?.message?.trim() || "Hello";
    const wantStream = Boolean(req.body?.stream);
    const roles = req.body?.roles || null;

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

    const influenceText = buildMemoryInfluence(prioritizedNodes);
    if (influenceText) {
      executivePacket.systemPrompt =
        (executivePacket.systemPrompt || "") + "\n" + influenceText;
    }

    // ─────────────────────────────────────────────
    // STREAM MODE
    // ─────────────────────────────────────────────
    if (wantStream && roles) {
      return res
        .status(400)
        .json({ error: "Streaming not supported in Role Mode yet." });
    }

    if (wantStream) {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      let streamedText = "";

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
        memoryInfluence: exposeMemory(prioritizedNodes),
      });

      res.end();
      return;
    }

    // ─────────────────────────────────────────────
    // NORMAL MODE
    // ─────────────────────────────────────────────

    let out;

    if (roles && roles.architect && roles.refiner && roles.polisher) {
      trace.log("roleMode.active", roles);
      out = await runRolePipeline({
        roles,
        osContext,
        executivePacket,
        trace,
      });
    } else {
      out = await runOrchestrator({
        osContext,
        executivePacket,
        trace,
      });
    }

    const reply =
      typeof out === "string" ? out : out?.reply || out?.text || null;

    if (!reply) {
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
      roleStack: roles || null,
      memoryInfluence: exposeMemory(prioritizedNodes),
    });
  } catch (err) {
    console.error("❌ /api/chat fatal error:", err);
    return res.status(500).json({ error: err.message || "Chat failed" });
  }
}
