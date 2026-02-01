// cipher_os/memory/memoryGraph.js
// Memory Graph v0 (Firestore) — load/write memory nodes + rolling summary

import { db } from "../../pages/api/db";

const NODES_LIMIT = 60;

export async function loadMemoryNodes(userId, limit = NODES_LIMIT) {
  const snap = await db
    .collection("memory_nodes")
    .doc(userId)
    .collection("nodes")
    .orderBy("updatedAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function writeMemoryNode(userId, node) {
  const ref = db
    .collection("memory_nodes")
    .doc(userId)
    .collection("nodes")
    .doc();

  const now = Date.now();

  await ref.set({
    type: node.type || "event",
    importance: node.importance || "low",
    content: String(node.content || "").trim(),
    tags: Array.isArray(node.tags) ? node.tags : [],
    createdAt: now,
    updatedAt: now,
    source: node.source || "chat",
  });

  return ref.id;
}

export async function bumpMemoryNode(userId, nodeId, patch = {}) {
  const ref = db
    .collection("memory_nodes")
    .doc(userId)
    .collection("nodes")
    .doc(nodeId);

  await ref.set(
    {
      ...patch,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}

export async function loadSummary(userId) {
  const ref = db.collection("summaries").doc(userId);
  const snap = await ref.get();
  return snap.exists ? snap.data() : { text: "", lastUpdated: 0, turns: 0 };
}

export async function saveSummary(userId, summaryText, turns = 0) {
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
  // Optional: helpful for debugging memory behavior
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
