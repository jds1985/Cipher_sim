// cipher_os/memory/memoryGraph.js
// Memory Graph v1 — gravity, promotion, decay

import { getDb } from "../../firebaseAdmin.js";

const NODES_LIMIT = 60;

const IMPORTANCE_WEIGHT = {
  high: 5,
  medium: 3,
  low: 1,
};

const DECAY_AMOUNT = 1;
const PROMOTION_THRESHOLD = 15;

export async function loadMemoryNodes(userId, limit = NODES_LIMIT) {
  const db = getDb();
  if (!db || !userId) return [];

  const snap = await db
    .collection("memory_nodes")
    .doc(userId)
    .collection("nodes")
    .orderBy("weight", "desc") // ⭐ gravity sort now
    .limit(limit)
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function writeMemoryNode(userId, node) {
  const db = getDb();
  if (!db || !userId || !node) return null;

  const ref = db
    .collection("memory_nodes")
    .doc(userId)
    .collection("nodes")
    .doc();

  const now = Date.now();
  const baseWeight = IMPORTANCE_WEIGHT[node.importance] || 1;

  await ref.set({
    type: node.type || "event",
    importance: node.importance || "low",
    content: String(node.content || "").trim(),
    tags: Array.isArray(node.tags) ? node.tags : [],
    createdAt: now,
    updatedAt: now,
    source: node.source || "chat",
    weight: baseWeight,
    strength: baseWeight,
  });

  return ref.id;
}

export async function bumpMemoryNode(userId, nodeId, amount = 1) {
  const db = getDb();
  if (!db || !userId || !nodeId) return;

  const ref = db
    .collection("memory_nodes")
    .doc(userId)
    .collection("nodes")
    .doc(nodeId);

  const snap = await ref.get();
  if (!snap.exists) return;

  const data = snap.data();
  const newStrength = (data.strength || 0) + amount;

  let newImportance = data.importance || "low";
  if (newStrength >= PROMOTION_THRESHOLD) newImportance = "high";
  else if (newStrength >= PROMOTION_THRESHOLD / 2) newImportance = "medium";

  await ref.set(
    {
      strength: newStrength,
      importance: newImportance,
      weight: newStrength,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}

export async function decayMemoryNodes(userId) {
  const db = getDb();
  if (!db || !userId) return;

  const snap = await db
    .collection("memory_nodes")
    .doc(userId)
    .collection("nodes")
    .get();

  const batch = db.batch();

  snap.docs.forEach((doc) => {
    const data = doc.data();
    const next = Math.max(0, (data.strength || 0) - DECAY_AMOUNT);

    batch.set(
      doc.ref,
      {
        strength: next,
        weight: next,
      },
      { merge: true }
    );
  });

  await batch.commit();
  console.log("🍂 memory decay:", snap.size);
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
