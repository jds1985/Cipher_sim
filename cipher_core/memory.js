// cipher_core/memory.js
// Firestore-backed memory engine (fail-open + bounded + transaction-safe)

import { getDb } from "../firebaseAdmin.js";

/* ===============================
   CONFIG
================================ */
const MAX_HISTORY = 50;

/* ===============================
   LOAD MEMORY (FAIL OPEN)
================================ */
export async function loadMemory(userId) {
  const db = getDb();
  if (!db || !userId) {
    return {
      history: [],
      meta: { createdAt: Date.now(), lastUpdated: Date.now(), disabled: true },
    };
  }

  const ref = db.collection("cipher_branches").doc(userId);
  const snap = await ref.get();

  if (!snap.exists) {
    return {
      history: [],
      meta: { createdAt: Date.now(), lastUpdated: Date.now() },
    };
  }

  const data = snap.data() || {};
  return {
    history: Array.isArray(data.history) ? data.history : [],
    meta: data.meta || {},
  };
}

/* ===============================
   SAVE MEMORY (FAIL OPEN + TXN SAFE)
================================ */
export async function saveMemory(userId, entry) {
  const db = getDb();
  if (!db || !userId || !entry || typeof entry !== "object") return;

  const ref = db.collection("cipher_branches").doc(userId);

  const normalizedEntry = {
    type: entry.type || "interaction", // identity | fact | preference | emotional | interaction
    role: entry.role || "system",      // user | assistant | system
    content: String(entry.content || ""),
    importance: entry.importance || "medium", // low | medium | high
    timestamp: entry.timestamp || Date.now(),
  };

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : {};

    const existingHistory = Array.isArray(data?.history) ? data.history : [];
    const updatedHistory = [...existingHistory, normalizedEntry].slice(-MAX_HISTORY);

    tx.set(
      ref,
      {
        history: updatedHistory,
        meta: {
          ...(data?.meta || {}),
          createdAt: data?.meta?.createdAt || Date.now(),
          lastUpdated: Date.now(),
        },
      },
      { merge: true }
    );
  });
}
