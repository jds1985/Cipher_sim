// pages/api/health.js
// Cipher OS Health Monitor

import { loadSummary } from "../../cipher_os/memory/memoryGraph.js";

export default async function handler(req, res) {
  try {
    const userId = "jim";

    const summary = await loadSummary(userId);

    return res.status(200).json({
      status: "ok",
      timestamp: Date.now(),
      memory: {
        summaryTurns: summary?.turns || 0,
        hasSummary: Boolean(summary?.text),
      },
      system: {
        openaiKey: Boolean(process.env.OPENAI_API_KEY),
        anthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
        geminiKey: Boolean(process.env.GEMINI_API_KEY),
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: "fail",
      error: err.message,
    });
  }
}
