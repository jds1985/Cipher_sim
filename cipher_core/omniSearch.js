// cipher_core/omniSearch.js
// Cipher 10.0 – Global Search (Stubbed until Omni is active)

import { db } from "../firebaseAdmin";

export async function omniSearch(query = "", userId = "jim_default") {
  try {
    if (!query.trim()) {
      return { results: [], message: "Empty query provided." };
    }

    const snap = await db
      .collection("cipher_memories")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const matches = all.filter((m) =>
      (m.userMessage || "").toLowerCase().includes(query.toLowerCase()) ||
      (m.cipherReply || "").toLowerCase().includes(query.toLowerCase())
    );

    return {
      results: matches,
      count: matches.length,
    };
  } catch (err) {
    console.error("omniSearch error:", err);
    return { results: [], count: 0 };
  }
}
