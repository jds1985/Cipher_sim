import { runCipherCore } from "../../cipher_core/core.js";
import { runOrchestrator } from "../../cipher_os/runtime/orchestrator.js";

export default async function handler(req, res) {
  const executivePacket = await runCipherCore(
    { history: [] },
    { userMessage: "Hello", returnPacket: true }
  );

  const out = await runOrchestrator({
    osContext: { input: { userMessage: "Hello" }, memory: {} },
    executivePacket
  });

  res.status(200).json(out);
}
