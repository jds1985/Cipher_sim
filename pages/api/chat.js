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

export default async function handler(req, res) {
  const message = req.body?.message || "Hello";

  const userId = "jim";
  const userName = "Jim";

  const longTermHistory = (await loadMemory(userId))?.history || [];
  const nodes = await loadMemoryNodes(userId, 60);
  const summaryDoc = await loadSummary(userId);

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

  const executivePacket = await runCipherCore(
    {
      history: osContext.memory.mergedHistory,
      nodes,
      summary: osContext.memory.longTermSummary,
    },
    { userMessage: message, returnPacket: true }
  );

  const out = await runOrchestrator({
    osContext,
    executivePacket,
  });

  await saveMemory(userId, { role: "user", content: message });
  await saveMemory(userId, { role: "assistant", content: out.reply });

  await writebackFromTurn({
    userId,
    userText: message,
    assistantText: out.reply,
  });

  await saveSummary(userId, summaryDoc?.text || "", (summaryDoc?.turns || 0) + 1);

  res.status(200).json(out);
}
