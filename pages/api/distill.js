export const runtime = "nodejs";
export const maxDuration = 60; 

import { buildOSContext } from "../../cipher_os/runtime/osContext.js";
import { runSovereignMind } from "../../cipher_os/runtime/orchestrator";
import { runCipherCore } from "../../cipher_core/core.js";
import { getDb } from "../../firebaseAdmin.js";
import { spendTokens } from "../../cipher_os/billing/tokenBank.js";

async function logTrainingData(userId, prompt, response) {
  try {
    const db = getDb();
    if (!db) return;
    await db.collection("cipher_training_set").add({
      timestamp: new Date().toISOString(),
      prompt,
      completion: response,
      label: "STATE_0_SYNTHESIS",
      metadata: { userId: userId || "guest", arch: "ternary_bitnet_1.58b_target" }
    });
  } catch (err) {
    console.error("❌ Distill Log Fail:", err);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, userId, tier } = req.body;
  const scenarios = message.split("[SCENARIO_START]").filter(s => s.trim().length > 5);

  try {
    const batchResults = await Promise.all(scenarios.map(async (task, i) => {
      const taskTrimmed = task.trim();
      const osContext = buildOSContext({ requestId: `batch-${i}`, userId, userMessage: taskTrimmed });
      
      const executivePacket = await runCipherCore({ history: [], nodes: [], summary: "" }, { userMessage: taskTrimmed, returnPacket: true });
      
      const out = await runSovereignMind({ osContext, executivePacket, roles: { mode: "ternary" } });
      const reply = out?.reply || out?.text || "";

      if (reply) await logTrainingData(userId, taskTrimmed, reply);
      return i + 1;
    }));

    spendTokens(userId || "guest", Math.ceil(message.length * 1.5), tier || "free");

    return res.status(200).json({
      reply: `### 🏦 Batch Distillation Complete\nProcessed and banked ${batchResults.length} scenarios.`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
