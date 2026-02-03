export const runtime = "nodejs";
// pages/api/chat.js
// Cipher OS — stable core (no summarizer)

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
  const message = req.body?.message || "Hello";

  const userId = "jim";
  const userName = "Jim";

  // Load long-term memory
  const memoryData = await loadMemory(userId);
  const longTermHistory = memoryData?.history || [];

  // Load memory graph
  const nodes = await loadMemoryNodes(userId, 60);
  const summaryDoc = await loadSummary(userId);

  // Build OS context
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

  // Executive layer
  const executivePacket = await runCipherCore(
    {
      history: osContext.memory.mergedHistory,
      nodes,
      summary: osContext.memory.longTermSummary,
    },
    { userMessage: message, returnPacket: true }
  );

  // Orchestrator
  const out = await runOrchestrator({
    osContext,
    executivePacket,
  });

  // Save memory
  await saveMemory(userId, {
    type: "interaction",
    role: "user",
    content: message,
  });

  await saveMemory(userId, {
    type: "interaction",
    role: "assistant",
    content: out.reply,
  });

  // Memory graph writeback
  await writebackFromTurn({
    userId,
    userText: message,
    assistantText: out.reply,
  });

  // Keep summary doc updated (but no AI summarizing)
  const turns = (summaryDoc?.turns || 0) + 1;
  await saveSummary(userId, summaryDoc?.text || "", turns);

  res.status(200).json(out);
}
