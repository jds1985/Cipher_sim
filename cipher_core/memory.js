// cipher_core/memory.js
// SoulTree 8.0 — TEMPORARY Local Memory Engine (No Firebase)

// In the future, we can swap this with a database again.
// For now, this keeps Cipher functional without breaking deploys.

let localMemory = [];

/* -------------------------------------------------------
   SAVE MEMORY — stores in local array only
------------------------------------------------------- */
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

    // Store locally (non-persistent)
    localMemory.push(doc);

    // Keep memory from growing too large
    if (localMemory.length > 200) {
      localMemory = localMemory.slice(-200);
    }
  } catch (err) {
    console.error("saveMemory error:", err);
  }
}

/* -------------------------------------------------------
   LOAD MEMORY — loads last N items (local only)
------------------------------------------------------- */
export async function loadMemory(userId = "jim_default", limit = 12) {
  try {
    const filtered = localMemory
      .filter((m) => m.userId === userId)
      .slice(-limit);

    if (!filtered.length) {
      return {
        memories: [],
        summary: "No prior memories yet.",
      };
    }

    const summaryLines = filtered.map((m, idx) => {
      const shortUser =
        m.userMessage && m.userMessage.length > 160
          ? m.userMessage.slice(0, 157) + "…"
          : m.userMessage || "[empty]";

      const shortReply =
        m.cipherReply && m.cipherReply.length > 180
          ? m.cipherReply.slice(0, 177) + "…"
          : m.cipherReply || "[empty]";

      return `#${idx + 1}
User: ${shortUser}
Cipher: ${shortReply}`;
    });

    return {
      memories: filtered,
      summary: summaryLines.join("\n\n"),
    };
  } catch (err) {
    console.error("loadMemory error:", err);
    return {
      memories: [],
      summary: "Error loading memories.",
    };
  }
}

/* Alias */
export async function loadRecentMemories(userId = "jim_default", limit = 12) {
  return loadMemory(userId, limit);
}
