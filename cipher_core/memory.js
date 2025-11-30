// cipher_core/memory.js
// SoulTree 8.0 — Unified Conversation Memory Engine

import { db } from "../firebaseAdmin";

/* -------------------------------------------------------
   SAVE MEMORY (flexible, backward-compatible)
------------------------------------------------------- */
export async function saveMemory(payload = {}) {
  try {
    const {
      userId = "jim_default",
      userMessage,
      message, // older callers may use "message"
      cipherReply,
      meta = {},
      deviceContext = null,
      ...rest
    } = payload;

    const doc = {
      userId,
      userMessage: userMessage || message || null,
      cipherReply: cipherReply || null,
      meta,
      deviceContext,
      createdAt: Date.now(),
      ...rest,
    };

    await db.collection("cipher_memories").add(doc);
  } catch (err) {
    console.error("saveMemory error:", err);
  }
}

/* -------------------------------------------------------
   LOAD RECENT MEMORIES + BUILD SUMMARY
------------------------------------------------------- */
export async function loadMemory(userId = "jim_default", limit = 12) {
  try {
    // Simple query: order by createdAt, then filter by userId in JS
    const snap = await db
      .collection("cipher_memories")
      .orderBy("createdAt", "desc")
      .limit(120)
      .get();

    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const filtered = all.filter((m) => m.userId === userId).slice(0, limit);

    if (!filtered.length) {
      return {
        memories: [],
        summary: "No prior conversation memories stored yet.",
      };
    }

    const summaryLines = filtered
      .slice()
      .reverse()
      .map((m, idx) => {
        const user = (m.userMessage || "").trim();
        const reply = (m.cipherReply || "").trim();

        const shortUser =
          user.length > 160 ? user.slice(0, 157).trim() + "…" : user;
        const shortReply =
          reply.length > 180 ? reply.slice(0, 177).trim() + "…" : reply;

        const ts = m.createdAt
          ? new Date(m.createdAt).toISOString()
          : "unknown time";

        return `#${idx + 1} (${ts})
User: ${shortUser || "[empty]"}
Cipher: ${shortReply || "[empty]"}`;
      });

    return {
      memories: filtered,
      summary: summaryLines.join("\n\n"),
    };
  } catch (err) {
    console.error("loadMemory error:", err);
    return {
      memories: [],
      summary: "Error loading prior memories.",
    };
  }
}

/* Convenience alias */
export async function loadRecentMemories(userId = "jim_default", limit = 12) {
  return loadMemory(userId, limit);
}
