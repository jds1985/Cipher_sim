export const runtime = "nodejs";
export const maxDuration = 60; // This gives the debate 1 minute to finish

// pages/api/chat.js
// Cipher OS — stable core + streaming + memory visibility + tier-safe role handling
// VERSION: 3.2 - FULL RESTORATION + BITNET DISTILLATION

import { runCipherCore } from "../../cipher_core/core.js";
import { loadMemory, saveMemory } from "../../cipher_core/memory.js";

import { buildOSContext } from "../../cipher_os/runtime/osContext.js";
// Handshake: Verified Import
import { runSovereignMind } from "../../cipher_os/runtime/orchestrator";

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

// 🆕 TOKEN BANK
import {
  canSpend,
  spendTokens,
  getRemaining,
} from "../../cipher_os/billing/tokenBank.js";

// 🆕 FIREBASE ADMIN FOR BITNET TRAINING
import { getDb } from "../../firebaseAdmin.js";

/* ============================================================
   🆕 BITNET DATA DISTILLATION HOOK
   Captures "State 0" logic for the $150 Downloadable Model
============================================================ */
async function logTrainingData(userId, prompt, response) {
  try {
    const db = getDb();
    if (!db) return;

    const trainingEntry = {
      timestamp: new Date().toISOString(),
      prompt: prompt,
      completion: response,
      label: "STATE_0_SYNTHESIS",
      quality_score: 1.0, 
      metadata: {
        userId: userId || "guest",
        arch: "ternary_bitnet_1.58b_target",
        source: "groq_distillation_v1",
        tier: "gold_set"
      }
    };

    await db.collection("cipher_training_set").add(trainingEntry);
    console.log("💾 [DISTILLATION] Synthesis banked for BitNet Cluster.");
  } catch (err) {
    console.error("❌ Training log failed:", err);
  }
}

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

function extractNumbers(message) {
  const nums = message.match(/\d+/g)?.map(Number) || [];

  return {
    price: nums[0] || null,
    monthlyRent: nums[1] || null,
    monthlyExpenses: nums[2] || null,
  };
}

async function agentDecision({ message, nodeOutputs, osContext, executivePacket }) {
  const toolSummary = nodeOutputs
    .map((n) => `${n.name}: ${JSON.stringify(n.result)}`)
    .join("\n");

  const agentPrompt = `
You are a senior real estate investment analyst.

User question:
${message}

Tool results:
${toolSummary}

Your job:
- Interpret all tool outputs together (not separately)
- Identify strengths and weaknesses of the deal
- Call out unrealistic assumptions if any
- Assess risk clearly (low, medium, high and why)
- Give a decisive recommendation (buy, caution, avoid)

Style:
- Be concise but insightful
- Sound like a professional investor, not a chatbot
- No fluff, no generic advice

Return only the final analysis.
`;

  const packet = {
    ...executivePacket,
    systemPrompt: (executivePacket.systemPrompt || "") + "\n\n" + agentPrompt,
  };

  // SURGICAL FIX: Changed runOrchestrator to runSovereignMind
  const out = await runSovereignMind({
    osContext,
    executivePacket: packet,
    roles: null,
  });

  return out?.reply;
}

function clampRolesByTier(roles, tier) {
  const safe =
    roles && roles.architect && roles.refiner && roles.polisher ? roles : null;
  if (!safe) return null;

  if (tier === "free") {
    return {
      architect: "openai",
      refiner: "openai",
      polisher: "openai",
    };
  }

  if (tier === "pro") {
    const vals = [safe.architect, safe.refiner, safe.polisher];
    const uniq = Array.from(new Set(vals));
    if (uniq.length <= 2) return safe;
    return { ...safe, polisher: safe.refiner };
  }

  return safe;
}

async function refineReply({ message, draftReply, osContext, executivePacket }) {
  if (!draftReply) return draftReply;

  const reviewPrompt = `
Review the response written by Cipher.

USER MESSAGE:
${message}

DRAFT RESPONSE:
${draftReply}

Check:
- Did it answer the user's question?
- Is it specific rather than generic?
- Could it be clearer or more useful?

If the response is already strong return it unchanged.
Otherwise rewrite it once to improve clarity and usefulness.

Return ONLY the final response.
`;

  const reviewPacket = {
    ...executivePacket,
    systemPrompt: (executivePacket.systemPrompt || "") + "\n\n" + reviewPrompt,
  };

  // SURGICAL FIX: Changed runOrchestrator to runSovereignMind
  const improved = await runSovereignMind({
    osContext,
    executivePacket: reviewPacket,
    roles: null,
  });

  return improved?.reply || draftReply;
}

function formatNodeReply(nodeResult) {
  if (!nodeResult || typeof nodeResult !== "object") {
    return `Here’s what I found:\n\n${JSON.stringify(nodeResult, null, 2)}`;
  }
    
  const parts = [];

  if (nodeResult.roi !== undefined) {
    parts.push(`💰 ROI: ${nodeResult.roi}%`);
  }

  if (nodeResult.monthlyCashFlow !== undefined) {
    parts.push(`📈 Monthly Cash Flow: $${nodeResult.monthlyCashFlow}`);
  }

  if (nodeResult.annualCashFlow !== undefined) {
    parts.push(`🏦 Annual Cash Flow: $${nodeResult.annualCashFlow}`);
  }

  if (nodeResult.monthlyExpenses !== undefined) {
    parts.push(`💸 Expenses: $${nodeResult.monthlyExpenses}`);
  }

  if (nodeResult.risk !== undefined) {
    parts.push(`⚠️ Risk: ${nodeResult.risk}`);
  }

  if (parts.length > 0) {
    return parts.join("\n");
  }

  return `Here’s what I found:\n\n${JSON.stringify(nodeResult, null, 2)}`;
}

async function synthesizeFinalAnswer({
  userMessage,
  nodeOutputs,
  mergedNodeResult,
  osContext,
  executivePacket,
}) {

   if (nodeOutputs && nodeOutputs.length > 0 && !mergedNodeResult.roi) {
    return `
   Knowledge:
${nodeOutputs.map(n => "- " + (n.result?.text || n.name)).join("\n")}
`;
  }
  const parts = [];

  if (mergedNodeResult.roi !== undefined) {
    parts.push(`💰 ROI: ${mergedNodeResult.roi}%`);
  }

  if (mergedNodeResult.monthlyCashFlow !== undefined) {
    parts.push(`📈 Monthly Cash Flow: $${mergedNodeResult.monthlyCashFlow}`);
  }

  if (mergedNodeResult.annualCashFlow !== undefined) {
    parts.push(`🏦 Annual Cash Flow: $${mergedNodeResult.annualCashFlow}`);
  }

  if (mergedNodeResult.monthlyPayment !== undefined) {
    parts.push(`🏦 Monthly Payment: $${mergedNodeResult.monthlyPayment}`);
  }

  if (mergedNodeResult.estimatedCashNeeded !== undefined) {
    parts.push(`💵 Cash Needed: $${mergedNodeResult.estimatedCashNeeded}`);
  }

  if (mergedNodeResult.expenseRatio !== undefined) {
    parts.push(`📊 Expense Ratio: ${mergedNodeResult.expenseRatio}`);
  }

  if (mergedNodeResult.risk !== undefined) {
    parts.push(`⚠️ Risk: ${mergedNodeResult.risk}`);
  }

  //  DECISION LAYER
  const decision = await agentDecision({
  message: userMessage,
  nodeOutputs,
  osContext,
  executivePacket,
});

return `
📊 Investment Analysis

${parts.join("\n")}

🧠 Analysis:
${decision}
`;
}

 export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const message = req.body?.message?.trim() || "Hello";
    const wantStream = Boolean(req.body?.stream);
    const tier = (req.body?.tier || "free").toLowerCase();
    const roles = { mode: "ternary" }; 

    // IDENTITY & TOKENS
    const userId = req.body?.userId || req.headers["x-user-id"] || null;
    const isGuest = !userId;
    const userName = req.body?.userName || null;
    const tokenUserId = userId || "guest";
    const estimatedCost = Math.ceil(message.length * 1.5);

    if (!canSpend(tokenUserId, estimatedCost, tier)) {
      return res.status(402).json({
        error: "Token limit reached",
        remaining: getRemaining(tokenUserId, tier),
      });
    }

    // 🆕 BATCH SPLITTER LOGIC
    const isBatch = message.includes("[SCENARIO_START]");
    const scenarios = isBatch 
      ? message.split("[SCENARIO_START]").filter(s => s.trim().length > 5) 
      : [message];

    let batchFeedback = "";
    let lastReplyForUI = "";
    let finalModelUsed = "VERIFIED_GROQ_DEPLOYMENT";
    let finalNodeResult = null;
    let finalPrioritizedNodes = [];

    const trace = {
      log: (event, payload) => console.log(`[TRACE] ${event}`, payload ?? ""),
    };


        // START BATCH LOOP
    const results = await Promise.all(scenarios.map(async (currentTask, index) => {
      // 1. Build a quick Context
      const osContext = buildOSContext({
        requestId: `${Date.now()}-${index}`,
        userId: tokenUserId,
        userMessage: currentTask,
      });

      const executivePacket = await runCipherCore(
        { history: [], nodes: [], summary: "" },
        { userMessage: currentTask, returnPacket: true }
      );

      // 2. Run the Mind
      const out = await runSovereignMind({ osContext, executivePacket, roles: { mode: "ternary" } });
      const reply = out?.reply || out?.text || "";

      // 3. Bank to Firebase
      if (reply) {
        await logTrainingData(userId, currentTask, reply);
      }
      
      return `✅ Scenario ${index + 1} Banked.`;
    }));

    const finalMessage = isBatch 
      ? `### 🏦 Batch Complete\n${results.join('\n')}`
      : lastReplyForUI;

     
      // CIPHERNET AUTO DISCOVERY
      let nodeResult = null;
      let nodeOutputs = [];
      let searchData = null; 

      try {
        const query = encodeURIComponent(currentTask.slice(0, 100));
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://cipheros.app";
        const searchRes = await fetch(`${baseUrl}/api/ciphernet/search?q=${query}&userId=${userId}`);
        searchData = await searchRes.json(); 

        if (searchData && searchData.results) {
          const selectedNodes = (searchData.results || []).filter(n => n.type !== "real_estate").slice(0, 3);
          nodeOutputs = selectedNodes.map((node) => ({
            name: node.content || node.name || "node",
            type: node.type,
            result: { text: node.content },
            trustScore: 1,
          }));

          if(nodeOutputs.length > 0) {
            const bestNode = nodeOutputs.reduce((best, current) => {
              const score = current.trustScore || 0;
              const bestScore = best?.trustScore || 0;
              return score > bestScore ? current : best;
            }, null);
            nodeResult = bestNode?.result || null;
          }
        }
      } catch (e) {
        console.log("❌ CipherNet discovery failed:", e.message);
      }

      // STREAM BYPASS FOR BATCH
      if (wantStream && !isBatch) {
          res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
          res.setHeader("Cache-Control", "no-cache, no-transform");
          res.setHeader("Connection", "keep-alive");
          res.flushHeaders?.();

          if (nodeResult) {
            const finalReply = await synthesizeFinalAnswer({ userMessage: currentTask, nodeOutputs, mergedNodeResult: nodeResult, osContext, executivePacket });
            await logTrainingData(userId, currentTask, finalReply);
            if (!isGuest) {
              await saveMemory(userId, { type: "interaction", role: "user", content: currentTask });
              await saveMemory(userId, { type: "interaction", role: "assistant", content: finalReply });
              const extracted = extractMemoryFromTurn(currentTask, finalReply);
              await writebackFromTurn({ userId, userText: currentTask, assistantText: finalReply, extracted });
              await runMemoryDecay(userId);
              await saveSummary(userId, summaryDoc?.text || "", (summaryDoc?.turns || 0) + 1);
            }
            spendTokens(tokenUserId, estimatedCost, tier);
            sseWrite(res, { type: "done", reply: finalReply, model: "ciphernet", memoryInfluence: exposeMemory(prioritizedNodes), remainingTokens: getRemaining(tokenUserId, tier), nodeResult });
            res.end();
            return;
          }

          let streamedText = "";
          const out = await runSovereignMind({ osContext, executivePacket, roles: null, trace, stream: true, onToken: (delta) => { streamedText += delta; sseWrite(res, { type: "delta", text: delta }); } });
          const finalReply = out?.reply || streamedText || "";
          if (finalReply) {
            await logTrainingData(userId, currentTask, finalReply);
            if (!isGuest) {
              await saveMemory(userId, { type: "interaction", role: "user", content: currentTask });
              await saveMemory(userId, { type: "interaction", role: "assistant", content: finalReply });
              const extracted = extractMemoryFromTurn(currentTask, finalReply);
              await writebackFromTurn({ userId, userText: currentTask, assistantText: finalReply, extracted });
              await runMemoryDecay(userId);
              await saveSummary(userId, summaryDoc?.text || "", (summaryDoc?.turns || 0) + 1);
            }
          }
          spendTokens(tokenUserId, estimatedCost, tier);
          sseWrite(res, { type: "done", reply: finalReply, model: "VERIFIED_GROQ_DEPLOYMENT", memoryInfluence: exposeMemory(prioritizedNodes), remainingTokens: getRemaining(tokenUserId, tier), nodeResult: null });
          res.end();
          return;
      }

      // NORMAL / BATCH EXECUTION
      const out = await runSovereignMind({ osContext, executivePacket, roles, trace });
      const reply = typeof out === "string" ? out : out?.reply || out?.text || null;
      if (!reply && !nodeResult) continue;

      let finalIterationReply;
      if (nodeOutputs.length > 0 && nodeResult) {
        finalIterationReply = await synthesizeFinalAnswer({ userMessage: currentTask, nodeOutputs, mergedNodeResult: nodeResult, osContext, executivePacket });
      } else {
        finalIterationReply = await refineReply({ message: currentTask, draftReply: reply, osContext, executivePacket });
      }

      await logTrainingData(userId, currentTask, finalIterationReply);

      if (!isGuest) {
        await saveMemory(userId, { type: "interaction", role: "user", content: currentTask });
        await saveMemory(userId, { type: "interaction", role: "assistant", content: finalIterationReply });
        const extracted = extractMemoryFromTurn(currentTask, finalIterationReply);
        await writebackFromTurn({ userId, userText: currentTask, assistantText: finalIterationReply, extracted });
        await runMemoryDecay(userId);
        await saveSummary(userId, summaryDoc?.text || "", (summaryDoc?.turns || 0) + 1);
      }

      if (isBatch) { batchFeedback += `✅ Scenario ${i + 1} Processed & Banked.\n`; }
      lastReplyForUI = finalIterationReply;
      finalModelUsed = out?.modelUsed?.model || out?.model || out?.engine || "VERIFIED_GROQ_DEPLOYMENT";
      finalNodeResult = nodeResult;
      finalPrioritizedNodes = prioritizedNodes;
    }

    spendTokens(tokenUserId, estimatedCost, tier);
    const displayReply = isBatch 
      ? `### 🏦 Batch Distillation Complete\nProcessed ${scenarios.length} scenarios into the Gold Set vault.\n\n${batchFeedback}`
      : lastReplyForUI;

    return res.status(200).json({
      reply: displayReply,
      model: finalModelUsed,
      memoryInfluence: exposeMemory(finalPrioritizedNodes),
      remainingTokens: getRemaining(tokenUserId, tier),
      nodeResult: finalNodeResult || null,
    });    

  } catch (err) {
    console.error("❌ /api/chat fatal error:", err);
    return res.status(500).json({
      error: err.message || "Chat failed",
    });
  }
}
