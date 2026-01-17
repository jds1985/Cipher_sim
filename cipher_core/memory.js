// cipher_core/memory.js
import { getDb } from "../firebaseAdmin";

const MAX_HISTORY = 50;

export async function loadMemory(userId) {
  const db = getDb();
  if (!db) return { history: [] };

  try {
    const ref = db.collection("cipher_branches").doc(userId);
    const snap = await ref.get();
    return { history: snap.exists ? snap.data().history || [] : [] };
  } catch (err) {
    console.error("Memory load failed:", err);
    return { history: [] };
  }
}

export async function saveMemory(userId, entry) {
  const db = getDb();
  if (!db) return;

  try {
    const ref = db.collection("cipher_branches").doc(userId);
    const snap = await ref.get();
    const history = snap.exists ? snap.data().history || [] : [];

    await ref.set(
      { history: [...history, entry].slice(-MAX_HISTORY) },
      { merge: true }
    );
  } catch (err) {
    console.error("Memory save failed:", err);
  }
}
