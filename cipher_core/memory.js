// cipher_core/memory.js
// Structured Firestore-backed memory engine (stable, bounded, race-safe)

import { db } from "../firebaseAdmin";

/* ===============================
   CONFIG
================================ */
const MAX_HISTORY = 50;

/* ===============================
   LOAD MEMORY
================================ */
export async function loadMemory(userId) {
  const ref = db.collection("cipher_branches").doc(userId);
  const snap = await ref.get();

  if (!snap.exists) {
    return {
      history: [],
      meta: {
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      },
    };
  }

  const data = snap.data() || {};

  return {
    history: Array.isArray(data.history) ? data.history : [],
    meta: data.meta || {},
  };
}

/* ===============================
   SAVE MEMORY (TRANSACTION SAFE)
================================ */
export async function saveMemory(userId, entry) {
  if (!userId || !entry || typeof entry !== "object") return;

  const ref = db.collection("cipher_branches").doc(userId);

  const normalizedEntry = {
    type: entry.type || "interaction", // identity | fact | preference | emotional | interaction
    role: entry.role || "assistant",
    content: String(entry.content || ""),
    importance: entry.importance || "medium", // low | medium | high
    timestamp: Date.now(),
  };

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : {};

    const existingHistory = Array.isArray(data?.history)
      ? data.history
      : [];

    const updatedHistory = [...existingHistory, normalizedEntry]
      .slice(-MAX_HISTORY);

    tx.set(
      ref,
      {
        history: updatedHistory,
        meta: {
          ...(data?.meta || {}),
          lastUpdated: Date.now(),
          createdAt: data?.meta?.createdAt || Date.now(),
        },
      },
      { merge: true }
    );
  });
}
