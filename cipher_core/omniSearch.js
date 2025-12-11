// cipher_core/omniSearch.js
// Cipher Core 10.0 — Omni Search (Firebase + Memory Index)

import { db } from "../firebaseAdmin";

/**
 * omniSearch
 * Searches through:
 *  • cipher_memories   (Firestorm conversation logs)
 *  • userMessage + cipherReply fields
 * Returns ranked hits with timestamps.
 */

export async function omniSearch(query = "", userId = "jim_default", limit = 25) {
  if (!query || typeof query !== "string") {
    return {
      query,
      hits: [],
      summary: "No search query provided.",
    };
  }

  try {
    // Fetch recent memory logs
    const snap = await db
      .collection("cipher_memories")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const userLogs = all.filter((m) => m.userId === userId);

    const q = query.toLowerCase();
    const hits = [];

    for (const log of userLogs) {
      const msg = (log.userMessage || "").toLowerCase();
      const rep = (log.cipherReply || "").toLowerCase();

      const score =
        (msg.includes(q) ? 1 : 0) +
        (rep.includes(q) ? 1 : 0);

      if (score > 0) {
        hits.push({
          id: log.id,
          createdAt: log.createdAt,
          userMessage: log.userMessage || "",
          cipherReply: log.cipherReply || "",
          score,
        });
      }
    }

    // Sort by score + recency
    hits.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    const trimmed = hits.slice(0, limit);

    return {
      query,
      count: trimmed.length,
      hits: trimmed,
      summary:
        trimmed.length === 0
          ? "No matches found."
          : `${trimmed.length} result(s) found for "${query}".`,
    };
  } catch (err) {
    console.error("🔥 omniSearch error:", err);
    return {
      query,
      hits: [],
      summary: "Error performing omni search.",
    };
  }
}
