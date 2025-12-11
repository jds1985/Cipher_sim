// cipher_core/loadMemoryPack.js
// Cipher 10.0 – Load User Static Memory Pack (Identity Facts)

import { db } from "../firebaseAdmin";

export async function loadMemoryPack(userId = "jim_default") {
  try {
    const snap = await db
      .collection("cipher_memory_pack")
      .doc(userId)
      .get();

    if (!snap.exists) {
      return null;
    }

    return snap.data();
  } catch (err) {
    console.error("loadMemoryPack error:", err);
    return null;
  }
}
