// cipher_core/memory.js
// Memory Engine 10.0 — Stable, Firebase-safe, no SoulTree references

import { db } from "../firebaseAdmin";

/* -------------------------------------------------------
   SAVE MEMORY (object-based)
------------------------------------------------------- */
export async function saveMemory(payload = {}) {
  try {
    const {
      userId = "jim_default",
      userMessage,
      message, // legacy support
      cipherReply,
      meta = {},
      deviceContext = null,
      ...rest
    } = payload;

    const doc = {
      userId,
      userMessage: userMessage || message || "",
      cipherReply: cipherReply || "",
      meta,
      deviceContext,
      createdAt: Date.now(),
      ...rest,
    };

    await db.collection("cipher_memories").add(doc);
  } catch (err) {
    console.error("🔥 saveMemory error:", err);
  }
}

/* -------------------------------------------------------
   LOAD MEMORY + BUILD SUMMARY TEXT
------------------------------------------------------- */
export async function loadMemory(userId = "jim_default", limit = 12) {
  try {
    const snap = await db
      .collection("cipher_memories")
      .orderBy("createdAt", "desc")
      .limit(150)
      .get();

    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const filtered = all.filter((m) => m.userId === userId).slice(0, limit);

    if (!filtered.length) {
      return {
        memories: [],
        summary: "No stored Cipher conversation memory yet.",
      };
    }

    const summary = filtered
      .slice() // clone
      .reverse()
      .map((m, i) => {
        const user = (m.userMessage || "").trim();
        const reply = (m.cipherReply || "").trim();

        const shortUser =
          user.length > 140 ? user.slice(0, 137).trim() + "…" : user;

        const shortReply =
          reply.length > 160 ? reply.slice(0, 157).trim() + "…" : reply;

        const ts = m.createdAt
          ? new Date(m.createdAt).toISOString()
          : "unknown time";

        return `#${i + 1} (${ts})
User: ${shortUser || "[empty]"}
Cipher: ${shortReply || "[empty]"}`;
      })
      .join("\n\n");

    return {
      memories: filtered,
      summary,
    };
  } catch (err) {
    console.error("🔥 loadMemory error:", err);
    return {
      memories: [],
      summary: "Memory load error (fallback mode).",
    };
  }
}
