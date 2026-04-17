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
    const requestedRoles = req.body?.roles || null;
    const roles = { mode: "ternary" }; 


    // ─────────────────────────────
    // USER IDENTITY
    // ─────────────────────────────
    const userId = req.body?.userId || req.headers["x-user-id"] || null;
    const isGuest = !userId;
    const userName = req.body?.userName || null;

    // ─────────────────────────────
    // TOKEN CHECK
    // ─────────────────────────────
    const tokenUserId = userId || "guest";
    const estimatedCost = Math.ceil(message.length * 1.5);

    console.log("TOKEN CHECK:", {
      userId: tokenUserId,
      tier,
      estimatedCost,
      remainingBefore: getRemaining(tokenUserId, tier),
    });

    if (!canSpend(tokenUserId, estimatedCost, tier)) {
      return res.status(402).json({
        error: "Token limit reached",
        remaining: getRemaining(tokenUserId, tier),
      });
    }

    const trace = {
      log: (event, payload) => console.log(`[TRACE] ${event}`, payload ?? ""),
    };

    // ─────────────────────────────
    // LOAD MEMORY
    // ─────────────────────────────
    let memoryData = { history: [] };
    let memoryNodes = [];
    let summaryDoc = null;

    if (!isGuest) {
      memoryData = await loadMemory(userId);
      memoryNodes = await loadMemoryNodes(userId, 120);
      summaryDoc = await loadSummary(userId);
    }

    const longTermHistory = Array.isArray(memoryData?.history)
      ? memoryData.history
      : [];

    const prioritized = prioritizeContext({
      history: longTermHistory,
      memoryNodes,
      summary: summaryDoc?.text || "",
      userMessage: message,
    });

    const prioritizedNodes = Array.isArray(prioritized?.nodes)
      ? prioritized.nodes
      : Array.isArray(memoryNodes)
      ? memoryNodes
      : [];

    // ─────────────────────────────
    // BUILD OS CONTEXT
    // ─────────────────────────────
    const osContext = buildOSContext({
      requestId: Date.now().toString(),
      userId: userId || "guest",
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

    const raw = message.trim();
    const tinyGreeting = /^(hi|hey|yo|hello|sup)$/i.test(raw);
    const isTiny = raw.length <= 10 && !/[?.!]/.test(raw);

    if (tinyGreeting || isTiny) {
      executivePacket.systemPrompt =
        (executivePacket.systemPrompt || "") +
        "\nIf the user input is a simple greeting or very short message, reply in 1-2 short sentences and ask one simple follow-up question at most.";
    }

    // ─────────────────────────────
    //  CIPHERNET AUTO DISCOVERY
    // ─────────────────────────────
    let nodeResult = null;
    let nodeOutputs = [];
    let searchData = null; 

    try {
      const query = encodeURIComponent(message.slice(0, 100));
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "https://cipheros.app";

      const searchRes = await fetch(
  `${baseUrl}/api/ciphernet/search?q=${query}&userId=${userId}`
);
      searchData = await searchRes.json(); 
      console.log("📦 SEARCH DATA:", JSON.stringify(searchData, null, 2));

      console.log("🧠 NODE OUTPUTS:", JSON.stringify(nodeOutputs, null, 2));

      if (nodeOutputs.length > 0) {
        nodeResult = nodeOutputs[0].result;
      }
    } catch (e) {
      console.log("❌ CipherNet discovery failed:", e.message);
    }

    // 🔥 MULTI-NODE EXECUTION (Phase 3.5)
    // We only proceed if searchData was successfully fetched
    if (searchData && searchData.results) {
      const MAX_NODES = 3;

      const selectedNodes = (searchData.results || [])
        .filter(n => n.type !== "real_estate")
       .slice(0, MAX_NODES);

      console.log("🧠 SELECTED NODES:", selectedNodes.map(n => n.name));

      // execute all nodes in parallel
      const execResults = selectedNodes.map((node) => {
  return {
    name: node.content || node.name || "node",
    type: node.type,
    result: {
      text: node.content,
    },
    trustScore: 1,
  };
});

nodeOutputs = execResults;
      

      // filter out failed nodes
      nodeOutputs = execResults.filter(Boolean);

      // 🔥 PICK BEST NODE (Trust System Phase 4)
      let mergedNodeResult = null;

      if(nodeOutputs.length > 0) {
        const bestNode = nodeOutputs.reduce((best, current) => {
          const score = current.trustScore || 0;
          const bestScore = best?.trustScore || 0;
          return score > bestScore ? current : best;
        }, null);

        mergedNodeResult = bestNode?.result || null;
        nodeResult = mergedNodeResult;
      }
    } 

    console.log("🧠 NODE OUTPUTS:", nodeOutputs);
    console.log("🧠 MERGED RESULT:", nodeResult);

    // ─────────────────────────────
    // STREAM MODE
    // ─────────────────────────────
    if (wantStream) {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      // If CipherNet found a result, return that immediately even in stream mode
      if (nodeResult) {
        const finalReply = await synthesizeFinalAnswer({
          userMessage: message,
          nodeOutputs,
          mergedNodeResult: nodeResult,
          osContext,
          executivePacket,
        });

        // 🔥 BITNET DATA DISTILLATION
        await logTrainingData(userId, message, finalReply);

        if (!isGuest) {
          await saveMemory(userId, {
            type: "interaction",
            role: "user",
            content: message,
          });

          await saveMemory(userId, {
            type: "interaction",
            role: "assistant",
            content: finalReply,
          });

          const extracted = extractMemoryFromTurn(message, finalReply);

          await writebackFromTurn({
            userId,
            userText: message,
            assistantText: finalReply,
            extracted,
          });

          await runMemoryDecay(userId);

          const turns = (summaryDoc?.turns || 0) + 1;
          await saveSummary(userId, summaryDoc?.text || "", turns);
        }

        spendTokens(tokenUserId, estimatedCost, tier);

        console.log("TOKENS AFTER SPEND:", {
          userId: tokenUserId,
          remainingAfter: getRemaining(tokenUserId, tier),
        });

        sseWrite(res, {
          type: "done",
          reply: finalReply,
          model: "ciphernet",
          provider: "internal",
          roleStack: null,
          memoryInfluence: exposeMemory(prioritizedNodes),
          remainingTokens: getRemaining(tokenUserId, tier),
          nodeResult,
        });

        res.end();
        return;
      }

      let streamedText = "";

      // SURGICAL FIX: Changed runOrchestrator to runSovereignMind
      const out = await runSovereignMind({
        osContext,
        executivePacket,
        roles: null,
        trace,
        stream: true,
        onToken: (delta) => {
          streamedText += delta;
          sseWrite(res, { type: "delta", text: delta });
        },
      });

      const finalReply = out?.reply || streamedText || "";

      if (!finalReply) {
        sseWrite(res, { type: "error", error: "Model produced no reply" });
        res.end();
        return;
      }

      // 🔥 BITNET DATA DISTILLATION
      await logTrainingData(userId, message, finalReply);

      if (!isGuest) {
        await saveMemory(userId, {
          type: "interaction",
          role: "user",
          content: message,
        });

        await saveMemory(userId, {
          type: "interaction",
          role: "assistant",
          content: finalReply,
        });

        const extracted = extractMemoryFromTurn(message, finalReply);

        await writebackFromTurn({
          userId,
          userText: message,
          assistantText: finalReply,
          extracted,
        });

        await runMemoryDecay(userId);

        const turns = (summaryDoc?.turns || 0) + 1;
        await saveSummary(userId, summaryDoc?.text || "", turns);
      }

      spendTokens(tokenUserId, estimatedCost, tier);

      console.log("TOKENS AFTER SPEND:", {
        userId: tokenUserId,
        remainingAfter: getRemaining(tokenUserId, tier),
      });

      sseWrite(res, {
        type: "done",
        reply: finalReply,
        model: "VERIFIED_GROQ_DEPLOYMENT",
        provider: out?.modelUsed?.provider || null,
        roleStack: null,
        memoryInfluence: exposeMemory(prioritizedNodes),
        remainingTokens: getRemaining(tokenUserId, tier),
        nodeResult: null,
      });

      res.end();
      return;
    }

    // ─────────────────────────────
    // NORMAL MODE
    // ─────────────────────────────
    // SURGICAL FIX: Already renamed to runSovereignMind
    const out = await runSovereignMind({
      osContext,
      executivePacket,
      roles,
      trace,
    });

    const reply =
      typeof out === "string" ? out : out?.reply || out?.text || null;

    if (!reply && !nodeResult) {
      return res.status(500).json({ error: "Model produced no reply" });
    }

    let finalReply;

    console.log("🧠 NODE OUTPUTS BEFORE DECISION:", nodeOutputs);

    if (nodeOutputs.length > 0 && nodeResult) {
      finalReply = await synthesizeFinalAnswer({
        userMessage: message,
        nodeOutputs,
        mergedNodeResult: nodeResult,
        osContext,
        executivePacket,
      });
    } else {
      finalReply = await refineReply({
        message,
        draftReply: reply,
        osContext,
        executivePacket,
      });
    }

    // 🔥 BITNET DATA DISTILLATION
    await logTrainingData(userId, message, finalReply);

    const model =
      out?.modelUsed?.model || out?.model || out?.engine || null;

    if (!isGuest) {
      await saveMemory(userId, {
        type: "interaction",
        role: "user",
        content: message,
      });

      await saveMemory(userId, {
        type: "interaction",
        role: "assistant",
        content: finalReply,
      });

      const extracted = extractMemoryFromTurn(message, finalReply);

      await writebackFromTurn({
        userId,
        userText: message,
        assistantText: finalReply,
        extracted,
      });

      await runMemoryDecay(userId);

      const turns = (summaryDoc?.turns || 0) + 1;
      await saveSummary(userId, summaryDoc?.text || "", turns);
    }

    spendTokens(tokenUserId, estimatedCost, tier);

    console.log("TOKENS AFTER SPEND:", {
      userId: tokenUserId,
      remainingAfter: getRemaining(tokenUserId, tier),
    });

    return res.status(200).json({
      reply: finalReply,
      model,
      roleStack: out?.roleStack || null,
      memoryInfluence: exposeMemory(prioritizedNodes),
      remainingTokens: getRemaining(tokenUserId, tier),
      nodeResult: nodeResult || null,
    });

  } catch (err) {
    console.error("❌ /api/chat fatal error:", err);
    return res.status(500).json({
      error: err.message || "Chat failed",
    });
  }
}
