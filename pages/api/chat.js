import { runCipherCore } from "../../cipher_core/core.js";
import { loadMemory } from "../../cipher_core/memory.js";
import { runOrchestrator } from "../../cipher_os/runtime/orchestrator.js";

export default async function handler(req, res) {
  const memoryData = await loadMemory("jim");

  const executivePacket = await runCipherCore(
    { history: memoryData.history || [] },
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
