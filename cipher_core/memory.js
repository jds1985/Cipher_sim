// cipher_core/memory.js
// Firestore-backed memory for Cipher 4.1

const COLLECTION = "cipher_memory";

// Load recent memory (most recent first)
export async function loadMemory(db, limit = 20) {
  try {
    const snapshot = await db
      .collection(COLLECTION)
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();

    const items = snapshot.docs.map((doc) => doc.data());
    // Return newest → oldest or reverse if you prefer
    return items.reverse();
  } catch (err) {
    console.error("loadMemory error:", err);
    return [];
  }
}

export async function saveMemory(db, entry) {
  try {
    await db.collection(COLLECTION).add(entry);
  } catch (err) {
    console.error("saveMemory error:", err);
  }
}
