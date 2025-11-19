// cipher_core/memory.js
// Firestore-backed memory for Cipher 4.3

import { db } from "../firebaseAdmin";

const COLLECTION = "cipher_memory";

// Load recent memory (optional: newest → oldest)
export async function loadMemory(limit = 20) {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();

    const items = snapshot.docs.map((doc) => doc.data());
    return items.reverse(); // oldest → newest
  } catch (err) {
    console.error("loadMemory error:", err);
    return [];
  }
}

// Save memory entry
export async function saveMemory(message, cipherReply) {
  try {
    await db.collection(COLLECTION).add({
      message,
      cipherReply,
      timestamp: Date.now(),
    });

    return true;
  } catch (err) {
    console.error("saveMemory error:", err);
    return false;
  }
}
