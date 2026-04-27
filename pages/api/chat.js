export const runtime = "nodejs";
export const maxDuration = 60; // This gives the debate 1 minute to finish

// pages/api/chat.js
// Cipher OS — stable core + streaming + memory visibility + tier-safe role handling
// VERSION: 3.3 - FULL RESTORATION + BITNET BYPASS

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
   🆕 BITNET DATA DISTILLATION HOOK — REWRITTEN
   Bypassing Firebase to prevent Quota Exhaustion.
============================================================ */
async function logTrainingData(userId, prompt, response) {
  // Logic preserved in memory, but committed only to console to save Quota
  const timestamp = new Date().toISOString();
  console.log(`🧬 [GENOME_LOG] ${timestamp} | User: ${userId} | Synthesis verified.`);
  return Promise.resolve();
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
User question: ${message}
Tool results: ${toolSummary}
Your job:
- Interpret all tool outputs together
- Identify strengths and weaknesses
- Assess risk clearly
- Give a decisive recommendation
Style: Concise, professional investor tone.
`;

  const packet = {
    ...executivePacket,
    systemPrompt: (executivePacket.systemPrompt || "") + "\n\n" + agentPrompt,
  };

  const out = await runSovereignMind({
    osContext,
    executivePacket: packet,
    roles: null,
  });

  return out?.reply;
}

function clampRolesByTier(roles, tier) {
  const safe = roles && roles.architect && roles.refiner && roles.polisher ? roles : null;
  if (!safe) return null;
  if (tier === "free") return { architect: "openai", refiner: "openai", polisher: "openai" };
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
  const reviewPrompt = `Review response clarity for user: ${message}. Draft: ${draftReply}. Return ONLY final response.`;
  const reviewPacket = { ...executivePacket, systemPrompt: (executivePacket.systemPrompt || "") + "\n\n" + reviewPrompt };
  const improved = await runSovereignMind({ osContext, executivePacket: reviewPacket, roles: null });
  return improved?.reply || draftReply;
}

function formatNodeReply(nodeResult) {
  if (!nodeResult || typeof nodeResult !== "object") return `Found: ${JSON.stringify(nodeResult, null, 2)}`;
  const parts = [];
  if (nodeResult.roi !== undefined) parts.push(`💰 ROI: ${nodeResult.roi}%`);
  if (nodeResult.monthlyCashFlow !== undefined) parts.push(`📈 Monthly: $${nodeResult.monthlyCashFlow}`);
  return parts.length > 0 ? parts.join("\n") : JSON.stringify(nodeResult, null, 2);
}

async function synthesizeFinalAnswer({ userMessage, nodeOutputs, mergedNodeResult, osContext, executivePacket }) {
  if (nodeOutputs && nodeOutputs.length > 0 && !mergedNodeResult.roi) {
    return `Knowledge:\n${nodeOutputs.map(n => "- " + (n.result?.text || n.name)).join("\n")}`;
  }
  const parts = [];
  if (mergedNodeResult.roi !== undefined) parts.push(`💰 ROI: ${mergedNodeResult.roi}%`);
  if (mergedNodeResult.risk !== undefined) parts.push(`⚠️ Risk: ${mergedNodeResult.risk}`);

  const decision = await agentDecision({ message: userMessage, nodeOutputs, osContext, executivePacket });

  return `📊 Investment Analysis\n\n${parts.join("\n")}\n\n🧠 Analysis:\n${decision}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const message = req.body?.message?.trim() || "Hello";
    const wantStream = Boolean(req.body?.stream);
    const tier = (req.body?.tier || "free").toLowerCase();
    const roles = { mode: "ternary" }; 
    const userId = req.body?.userId || req.headers["x-user-id"] || null;
    const isGuest = !userId;
    const userName = req.body?.userName || null;

    const tokenUserId = userId || "guest";
    const estimatedCost = Math.ceil(message.length * 1.5);

    if (!canSpend(tokenUserId, estimatedCost, tier)) {
      return res.status(402).json({ error: "Token limit reached" });
    }

    // MEMORY BLOCK
    let memoryData = { history: [] };
    let memoryNodes = [];
    let summaryDoc = null;

    if (!isGuest) {
      try {
        memoryData = await loadMemory(userId);
        memoryNodes = await loadMemoryNodes(userId, 120);
        summaryDoc = await loadSummary(userId);
      } catch(e) { console.log("⚠️ Load bypass"); }
    }

    const longTermHistory = Array.isArray(memoryData?.history) ? memoryData.history : [];
    const prioritized = prioritizeContext({ history: longTermHistory, memoryNodes, summary: summaryDoc?.text || "", userMessage: message });

    const osContext = buildOSContext({
      requestId: Date.now().toString(),
      userId: userId || "guest",
      userName,
      userMessage: message,
      uiHistory: [],
      longTermHistory,
      memoryNodes: prioritized.nodes || [],
    });

    const executivePacket = await runCipherCore(
      { history: osContext.memory.mergedHistory, nodes: prioritized.nodes || [], summary: summaryDoc?.text || "" },
      { userMessage: message, returnPacket: true }
    );

    executivePacket.systemPrompt += `\nMANDATE: LOGIC -> VERDICT. High density data-speak only.`;

    // CIPHERNET DISCOVERY
    let nodeResult = null;
    let nodeOutputs = [];
    let searchData = null; 

    try {
      const query = encodeURIComponent(message.slice(0, 100));
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://cipheros.app";
      const searchRes = await fetch(`${baseUrl}/api/ciphernet/search?q=${query}&userId=${userId}`);
      searchData = await searchRes.json(); 

      if (searchData && searchData.results) {
        nodeOutputs = (searchData.results || []).slice(0, 3).map(n => ({
          name: n.content || n.name || "node",
          result: { text: n.content },
          trustScore: 1
        }));
        nodeResult = nodeOutputs[0]?.result;
      }
    } catch (e) { console.log("❌ CipherNet skipped"); }

    // STREAM MODE
    if (wantStream) {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      if (nodeResult) {
        const finalReply = await synthesizeFinalAnswer({ userMessage: message, nodeOutputs, mergedNodeResult: nodeResult, osContext, executivePacket });
        await logTrainingData(userId, message, finalReply);
        spendTokens(tokenUserId, estimatedCost, tier);
        sseWrite(res, { type: "done", reply: finalReply, nodeResult });
        res.end();
        return;
      }

      let streamedText = "";
      const out = await runSovereignMind({
        osContext, executivePacket, roles: null, stream: true,
        onToken: (delta) => { streamedText += delta; sseWrite(res, { type: "delta", text: delta }); },
      });

      const finalReply = out?.reply || streamedText || "";
      await logTrainingData(userId, message, finalReply);
      spendTokens(tokenUserId, estimatedCost, tier);
      sseWrite(res, { type: "done", reply: finalReply });
      res.end();
      return;
    }

    // NORMAL MODE
    const out = await runSovereignMind({ osContext, executivePacket, roles, trace: { log: (e,p) => console.log(`[TRACE] ${e}`) } });
    const reply = typeof out === "string" ? out : out?.reply || out?.text || null;
    const finalReply = (nodeOutputs.length > 0 && nodeResult) 
      ? await synthesizeFinalAnswer({ userMessage: message, nodeOutputs, mergedNodeResult: nodeResult, osContext, executivePacket })
      : await refineReply({ message, draftReply: reply, osContext, executivePacket });

    await logTrainingData(userId, message, finalReply);
    spendTokens(tokenUserId, estimatedCost, tier);

    return res.status(200).json({ reply: finalReply, remainingTokens: getRemaining(tokenUserId, tier) });

  } catch (err) {
    console.error("❌ Fatal error:", err);
    return res.status(500).json({ error: "Chat failed" });
  }
}
