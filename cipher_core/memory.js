// cipher_core/memory.js
// Unified Conversation Memory Engine

import { db } from "../firebaseAdmin";

/* SAVE MEMORY */
export async function saveMemory(payload = {}) {
  try {
    const {
      userId = "jim_default",
      userMessage,
      message,
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

/* LOAD MEMORY */
export async function loadMemory(userId = "jim_default", limit = 12) {
  try {
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
        const u = (m.userMessage || "").trim();
        const r = (m.cipherReply || "").trim();

        const su = u.length > 160 ? u.slice(0, 157) + "…" : u;
        const sr = r.length > 180 ? r.slice(0, 177) + "…" : r;

        const ts = m.createdAt
          ? new Date(m.createdAt).toISOString()
          : "unknown time";

        return `#${idx + 1} (${ts})
User: ${su || "[empty]"}
Cipher: ${sr || "[empty]"}`;
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
