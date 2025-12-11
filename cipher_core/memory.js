// cipher_core/memory.js
// Simple Firestore-backed memory engine

import { db } from "../firebaseAdmin";

export async function loadMemory(userId) {
  const ref = db.collection("cipher_branches").doc(userId);
  const snap = await ref.get();
  return snap.exists ? snap.data() : { history: [] };
}

export async function saveMemory(userId, entry) {
  const ref = db.collection("cipher_branches").doc(userId);
  await ref.set(
    {
      history: db.FieldValue.arrayUnion(entry),
    },
    { merge: true }
  );
}
