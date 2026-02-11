// cipher_os/memory/memoryWriteback.js
// Heuristic memory extraction + writeback (v5)
// Reinforcement = strength bump + promotion
// Identity Lock = identity/preference are locked on creation
// Duplicate protection kept

import { writeMemoryNode, loadMemoryNodes, bumpMemoryNode } from "./memoryGraph.js";

/* ===============================
   IMPORTANCE LADDER
================================ */
const IMPORTANCE_ORDER = ["low", "medium", "high", "core"];

function bumpImportance(level = "low") {
  const i = IMPORTANCE_ORDER.indexOf(level);
  if (i === -1) return "medium";
  return IMPORTANCE_ORDER[Math.min(i + 1, IMPORTANCE_ORDER.length - 1)];
}

/* ===============================
   SIGNAL DETECTION
================================ */
function looksHighSignal(text) {
  const t = (text || "").toLowerCase();
  if (!t) return false;

  const triggers = [
    "my name is",
    "call me",
    "i prefer",
    "remember",
    "from now on",
    "we will",
    "we're building",
    "i'm building",
    "the goal is",
    "launch",
    "pricing",
    "tier",
    "firebase",
    "vercel",
    "repo",
    "cipher os",
    "orchestrator",
  ];

  // ⭐ identity & preference ALWAYS qualify even if short
  if (
    t.includes("call me") ||
    t.includes("my name is") ||
    t.includes("i prefer")
  ) {
    return true;
  }

  // others must be long enough
  if (t.length < 40) return false;

  return triggers.some((k) => t.includes(k));
}

function classify(text) {
  const t = (text || "").toLowerCase();

  if (t.includes("call me") || t.includes("my name is")) return "identity";
  if (t.includes("i prefer") || t.includes("from now on")) return "preference";
  if (t.includes("we're building") || t.includes("i'm building")) return "project";
  if (t.includes("launch") || t.includes("pricing") || t.includes("tier")) return "project";
  if (t.includes("firebase") || t.includes("vercel") || t.includes("repo")) return "lesson";

  return "event";
}

function tagsFor(text) {
  const t = (text || "").toLowerCase();
  const tags = [];

  if (t.includes("firebase")) tags.push("firebase");
  if (t.includes("vercel")) tags.push("vercel");
  if (t.includes("claude")) tags.push("anthropic");
  if (t.includes("gemini")) tags.push("gemini");
  if (t.includes("openai")) tags.push("openai");
  if (t.includes("memory")) tags.push("memory");
  if (t.includes("cipher os")) tags.push("cipher_os");

  return tags;
}

/* ===============================
   SIMILARITY
================================ */
function isSimilar(a = "", b = "") {
  const clean = (t) =>
    t
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const A = clean(a);
  const B = clean(b);

  if (!A || !B) return false;
  if (A === B) return true;
  if (A.includes(B) || B.includes(A)) return true;

  const wordsA = new Set(A.split(" "));
  const wordsB = new Set(B.split(" "));

  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }

  const similarity = overlap / Math.max(wordsA.size, 1);
  return similarity > 0.6;
}

/* ===============================
   LOCK RULES
================================ */
function shouldLock(type) {
  return type === "identity" || type === "preference";
}

/* ===============================
   REINFORCEMENT (REAL)
================================ */
async function reinforceExisting(userId, existingNode) {
  // gravity bump
  await bumpMemoryNode(userId, existingNode.id, 1);

  // keep locked memories locked forever
  if (existingNode.locked) {
    await bumpMemoryNode(userId, existingNode.id, {
      locked: true,
      lockType: existingNode.lockType || "identity",
      lockReason: existingNode.lockReason || "protected",
    });
  }

  const nextImportance = bumpImportance(existingNode.importance);

  await bumpMemoryNode(userId, existingNode.id, {
    reinforcementCount: (existingNode.reinforcementCount || 0) + 1,
    lastReinforcedAt: Date.now(),
    importance: nextImportance,
  });

  console.log("🧠 reinforced:", existingNode.id, "→", nextImportance);
}

/* ===============================
   WRITEBACK
================================ */
export async function writebackFromTurn({ userId, userText, assistantText }) {
  let wrote = 0;
  let reinforced = 0;

  const existingNodes = await loadMemoryNodes(userId, 200);

  /* ── USER MEMORY ───────────────────── */
  if (looksHighSignal(userText)) {
    const type = classify(userText);
    const match = existingNodes.find((n) => isSimilar(n.content, userText));

    if (match) {
      await reinforceExisting(userId, match);
      reinforced++;
    } else {
      const lockIt = shouldLock(type);

      await writeMemoryNode(userId, {
        type,
        importance: lockIt ? "core" : "high",
        content: userText,
        tags: ["user", ...tagsFor(userText)],
        source: "chat:user",

        reinforcementCount: 1,
        lastReinforcedAt: Date.now(),

        locked: lockIt,
        lockType: lockIt ? type : null,
        lockReason: lockIt ? "identity/preference" : null,
        lockedAt: lockIt ? Date.now() : 0,
      });

      wrote++;
    }
  }

  /* ── ASSISTANT MEMORY ───────────────── */
  if (looksHighSignal(assistantText)) {
    const trimmed = assistantText.slice(0, 800);
    const match = existingNodes.find((n) => isSimilar(n.content, trimmed));

    if (match) {
      await reinforceExisting(userId, match);
      reinforced++;
    } else {
      await writeMemoryNode(userId, {
        type: "decision",
        importance: "medium",
        content: trimmed,
        tags: ["assistant", ...tagsFor(assistantText)],
        source: "chat:assistant",

        reinforcementCount: 1,
        lastReinforcedAt: Date.now(),
        locked: false,
      });

      wrote++;
    }
  }

  console.log("🧠 writeback:", { wrote, reinforced });
  return { wrote, reinforced };
}
