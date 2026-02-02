import { runOrchestrator } from "../../cipher_os/runtime/orchestrator.js";

export default async function handler(req, res) {
  const out = await runOrchestrator({
    osContext: { input: { userMessage: "test" }, memory: {} },
    executivePacket: { systemPrompt: "Say hello." }
  });

  res.status(200).json(out);
}
