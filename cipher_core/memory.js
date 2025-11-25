// cipher_core/memory.js
// Firestore-backed memory for Cipher 5.x (safe & stable)

import { db } from "../firebaseAdmin";

const COLLECTION = "cipher_memory";

// ----------------------------------------------------
// LOAD MEMORY (returns newest → oldest)
// ----------------------------------------------------
export async function loadMemory(limit = 20) {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => doc.data());
  } catch (err) {
    console.error("loadMemory error:", err);
    return [];
  }
}

// ----------------------------------------------------
// SAVE MEMORY (safe, ignores undefined, prevents crash)
// ----------------------------------------------------
export async function saveMemory(entry) {
  try {
    // prevent Firestore from breaking on undefined values
    const cleaned = JSON.parse(
      JSON.stringify(entry, (_key, value) =>
        value === undefined ? null : value
      )
    );

    await db.collection(COLLECTION).add(cleaned);

    return true;
  } catch (err) {
    console.error("saveMemory error:", err);
    return false;
  }
}
