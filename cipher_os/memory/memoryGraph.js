// cipher_os/memory/memoryGraph.js
// Memory Graph v2 — gravity + promotion + decay helpers + identity lock support
// Fixes:
// - exports updateMemoryNode (so memoryDecay.js stops breaking)
// - writeMemoryNode can UPSERT when node.id is provided (no dupes)
// - bumpMemoryNode accepts (amount:number) OR (patch:object)
// - avoids Firestore "importance" string ordering bugs by sorting in JS

import { getDb } from "../../firebaseAdmin.js";

const NODES_LIMIT = 60;

const IMPORTANCE_WEIGHT = {
  core: 10,
  high: 5,
  medium: 3,
  low: 1,
};

const IMPORTANCE_RANK = {
  core: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const DECAY_AMOUNT = 1;
const PROMOTION_THRESHOLD = 15; // strength threshold for high
const CORE_THRESHOLD = PROMOTION_THRESHOLD * 2;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function rankFor(importance = "low") {
  return IMPORTANCE_RANK[importance] || 1;
}

function promoteByStrength(strength = 0) {
  if (strength >= CORE_THRESHOLD) return "core";
  if (strength >= PROMOTION_THRESHOLD) return "high";
  if (strength >= PROMOTION_THRESHOLD / 2) return "medium";
  return "low";
}

export async function loadMemoryNodes(userId, limit = NODES_LIMIT) {
  const db = getDb();
  if (!db || !userId) {
    console.log("🚫 loadMemoryNodes → db missing or userId missing");
    return [];
  }

  // Keep query simple to avoid composite-index pain.
  // We fetch recent-ish, then sort by gravity/priority in JS.
  const fetchLimit = Math.max(limit * 4, 120);

  const snap = await db
    .collection("memory_nodes")
    .doc(userId)
    .collection("nodes")
    .orderBy("updatedAt", "desc")
    .limit(fetchLimit)
    .get();

  console.log("📖 memory nodes read:", snap.size);

  const nodes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Gravity sort: locked/core/high float up, then strength/weight, then recency
  nodes.sort((a, b) => {
    const aLock = a.locked ? 1 : 0;
    const bLock = b.locked ? 1 : 0;
    if (aLock !== bLock) return bLock - aLock;

    const aRank = rankFor(a.importance);
    const bRank = rankFor(b.importance);
    if (aRank !== bRank) return bRank - aRank;

    const aw = Number(a.weight ?? a.strength ?? 0);
    const bw = Number(b.weight ?? b.strength ?? 0);
    if (aw !== bw) return bw - aw;

    const au = Number(a.updatedAt ?? 0);
    const bu = Number(b.updatedAt ?? 0);
    return bu - au;
  });

  return nodes.slice(0, limit);
}

export async function writeMemoryNode(userId, node) {
  const db = getDb();
  if (!db || !userId || !node) {
    console.log("🚫 writeMemoryNode → db missing");
    return null;
  }

  const col = db.collection("memory_nodes").doc(userId).collection("nodes");

  // ✅ UPSERT: if node.id is provided, update that doc instead of creating a new one
  const ref = node.id ? col.doc(String(node.id)) : col.doc();

  const now = Date.now();
  const importance = node.importance || "low";
  const baseWeight = IMPORTANCE_WEIGHT[importance] || 1;

  const payload = {
    type: node.type || "event",
    importance,
    importanceRank: rankFor(importance),

    content: String(node.content || "").trim(),
    tags: Array.isArray(node.tags) ? node.tags : [],
    source: node.source || "chat",

    // gravity fields
    strength: Number(node.strength ?? node.weight ?? baseWeight),
    weight: Number(node.weight ?? node.strength ?? baseWeight),

    // reinforcement fields (optional but supported)
    reinforcementCount: Number(node.reinforcementCount ?? 0),
    lastReinforcedAt: Number(node.lastReinforcedAt ?? 0),

    // lock fields
    locked: Boolean(node.locked),
    lockType: node.lockType || null,
    lockReason: node.lockReason || null,
    lockedAt: Number(node.lockedAt ?? 0),

    createdAt: Number(node.createdAt ?? now),
    updatedAt: now,
  };

  await ref.set(payload, { merge: true });

  console.log("🧠 MEMORY UPSERT:", userId, ref.id, {
    importance: payload.importance,
    locked: payload.locked,
    strength: payload.strength,
  });

  return ref.id;
}

export async function updateMemoryNode(userId, nodeId, patch = {}) {
  const db = getDb();
  if (!db || !userId || !nodeId) {
    console.log("🚫 updateMemoryNode → db missing");
    return;
  }

  const ref = db
    .collection("memory_nodes")
    .doc(userId)
    .collection("nodes")
    .doc(String(nodeId));

  const next = { ...patch, updatedAt: Date.now() };

  // If patch changes importance, keep rank aligned
  if (typeof patch.importance === "string") {
    next.importanceRank = rankFor(patch.importance);
  }

  await ref.set(next, { merge: true });
}

/**
 * bumpMemoryNode supports:
 * - bumpMemoryNode(userId, nodeId, 1)        -> strength/weight +1 + promotion
 * - bumpMemoryNode(userId, nodeId, { ... })  -> merge patch + (optional) also runs promotion if strength changes
 */
export async function bumpMemoryNode(userId, nodeId, amountOrPatch = 1) {
  const db = getDb();
  if (!db || !userId || !nodeId) {
    console.log("🚫 bumpMemoryNode → db missing");
    return;
  }

  const ref = db
    .collection("memory_nodes")
    .doc(userId)
    .collection("nodes")
    .doc(String(nodeId));

  const snap = await ref.get();
  if (!snap.exists) return;

  const data = snap.data() || {};

  // PATCH MODE
  if (typeof amountOrPatch === "object" && amountOrPatch) {
    const patch = { ...amountOrPatch, updatedAt: Date.now() };

    // If patch provides importance, keep rank aligned
    if (typeof patch.importance === "string") {
      patch.importanceRank = rankFor(patch.importance);
    }

    // If patch touches strength/weight, keep them synced
    if (typeof patch.strength === "number" && typeof patch.weight !== "number") {
      patch.weight = patch.strength;
    }
    if (typeof patch.weight === "number" && typeof patch.strength !== "number") {
      patch.strength = patch.weight;
    }

    await ref.set(patch, { merge: true });
    return;
  }

  // AMOUNT MODE
  const amount = Number(amountOrPatch || 0);

  const currentStrength = Number(data.strength ?? data.weight ?? 0);
  const nextStrength = clamp(currentStrength + amount, 0, 999999);

  const promoted = promoteByStrength(nextStrength);

  const currentReinf = Number(data.reinforcementCount ?? 0);
  const nextReinf = clamp(currentReinf + (amount > 0 ? 1 : 0), 0, 999999);

  await ref.set(
    {
      strength: nextStrength,
      weight: nextStrength,
      importance: promoted,
      importanceRank: rankFor(promoted),

      reinforcementCount: nextReinf,
      lastReinforcedAt: amount > 0 ? Date.now() : Number(data.lastReinforcedAt ?? 0),

      updatedAt: Date.now(),
    },
    { merge: true }
  );

  console.log("⬆️ MEMORY BUMP:", nodeId, "→", nextStrength, promoted);
}

export async function decayMemoryNodes(userId) {
  const db = getDb();
  if (!db || !userId) {
    console.log("🚫 decayMemoryNodes → db missing");
    return;
  }

  const snap = await db
    .collection("memory_nodes")
    .doc(userId)
    .collection("nodes")
    .get();

  const batch = db.batch();
  let decayed = 0;
  let locked = 0;

  snap.docs.forEach((doc) => {
    const data = doc.data() || {};

    if (data.locked) {
      locked++;
      return;
    }

    const strength = Number(data.strength ?? data.weight ?? 0);
    if (strength <= 0) return;

    const nextStrength = Math.max(0, strength - DECAY_AMOUNT);
    const nextImportance = promoteByStrength(nextStrength);

    batch.set(
      doc.ref,
      {
        strength: nextStrength,
        weight: nextStrength,
        importance: nextImportance,
        importanceRank: rankFor(nextImportance),
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    decayed++;
  });

  await batch.commit();
  console.log("🍂 memory decay:", decayed, "| locked:", locked);
}

export async function loadSummary(userId) {
  const db = getDb();
  if (!db || !userId) return { text: "", lastUpdated: 0, turns: 0 };

  const ref = db.collection("summaries").doc(userId);
  const snap = await ref.get();
  return snap.exists ? snap.data() : { text: "", lastUpdated: 0, turns: 0 };
}

export async function saveSummary(userId, summaryText, turns = 0) {
  const db = getDb();
  if (!db || !userId) return;

  const ref = db.collection("summaries").doc(userId);
  await ref.set(
    {
      text: String(summaryText || "").trim(),
      lastUpdated: Date.now(),
      turns: Number(turns || 0),
    },
    { merge: true }
  );
}

export async function logTurn(userId, payload) {
  const db = getDb();
  if (!db || !userId || !payload) return null;

  const ref = db
    .collection("cipher_os_logs")
    .doc(userId)
    .collection("turns")
    .doc();

  await ref.set({
    ...payload,
    createdAt: Date.now(),
  });

  return ref.id;
}
