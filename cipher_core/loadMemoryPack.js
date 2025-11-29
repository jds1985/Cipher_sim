// cipher_core/loadMemoryPack.js
// Load Jim's User Memory Pack cleanly

import { db } from "../firebaseAdmin";

export async function loadMemoryPack() {
  try {
    const ref = db.collection("cipher_branches").doc("user_memory_pack");
    const snap = await ref.get();

    if (!snap.exists) {
      console.warn("⚠ No user_memory_pack found in Firestore.");
      return null;
    }

    return snap.data();
  } catch (err) {
    console.error("Memory Pack Load Error:", err);
    return null;
  }
}
