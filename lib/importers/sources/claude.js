// lib/importers/sources/claude.js

function isClaudeLike(raw) {
  // Heuristic: threads/chats array with messages that have role/content
  const arr =
    (raw && Array.isArray(raw.chats) && raw.chats) ||
    (raw && Array.isArray(raw.conversations) && raw.conversations) ||
    (raw && Array.isArray(raw.threads) && raw.threads) ||
    null;

  if (!arr) return false;

  return arr.some((t) => Array.isArray(t.messages) && t.messages.some((m) => m.role && (m.content || m.text)));
}

export const claudeImporter = {
  id: "claude",
  canParse(raw) {
    return isClaudeLike(raw);
  },
  parse(raw) {
    const threadsRaw =
      raw.chats || raw.threads || raw.conversations || [];

    const threads = threadsRaw.map((t) => {
      const title = t.title || t.name || "Imported Claude Chat";
      const createdAt = t.created_at || t.createdAt || Date.now() / 1000;
      const sourceThreadId = t.id || t.uuid || `${title}-${createdAt}`;

      const messages = (t.messages || [])
        .map((m) => ({
          role: m.role,
          content: m.content || m.text || (Array.isArray(m.parts) ? m.parts.join("\n") : ""),
          ts: m.created_at || m.ts || createdAt,
        }))
        .filter((m) => (m.role === "user" || m.role === "assistant") && m.content);

      return { sourceThreadId, title, createdAt, messages };
    }).filter((t) => t.messages.length > 0);

    return { source: "claude", threads };
  },
};
