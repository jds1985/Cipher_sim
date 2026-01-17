// cipher_core/memory.js
// Structured Firestore-backed memory engine (stable + bounded)

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
   SAVE MEMORY
================================ */
export async function saveMemory(userId, entry) {
  if (!entry || typeof entry !== "object") return;

  const ref = db.collection("cipher_branches").doc(userId);

  // Normalize memory entry
  const normalizedEntry = {
    type: entry.type || "interaction", // identity | fact | preference | emotional | interaction
    role: entry.role || "system",
    content: String(entry.content || ""),
    importance: entry.importance || "medium", // low | medium | high
    timestamp: Date.now(),
  };

  const snap = await ref.get();
  const existing = snap.exists ? snap.data().history || [] : [];

  // Append + trim (keep most recent + important)
  const updatedHistory = [...existing, normalizedEntry]
    .slice(-MAX_HISTORY);

  await ref.set(
    {
      history: updatedHistory,
      meta: {
        lastUpdated: Date.now(),
      },
    },
    { merge: true }
  );
}
