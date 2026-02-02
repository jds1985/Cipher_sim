import { runCipherCore } from "../../cipher_core/core.js";
import { loadMemory } from "../../cipher_core/memory.js";
import { runOrchestrator } from "../../cipher_os/runtime/orchestrator.js";

import { loadMemoryNodes } from "../../cipher_os/memory/memoryGraph.js";
import { updateRollingSummary } from "../../cipher_os/memory/summarizer.js";

export default async function handler(req, res) {
  const memoryData = await loadMemory("jim");
  const nodes = await loadMemoryNodes("jim", 10);

  const summary = await updateRollingSummary({
    previousSummary: "",
    recentMessages: [],
  });

  const executivePacket = await runCipherCore(
    {
      history: memoryData.history || [],
      nodes,
      summary
    },
    { userMessage: "Hello", returnPacket: true }
  );

  const out = await runOrchestrator({
    osContext: {
      input: { userMessage: "Hello" },
      memory: { uiHistory: [] }
    },
    executivePacket
  });

  res.status(200).json(out);
}
