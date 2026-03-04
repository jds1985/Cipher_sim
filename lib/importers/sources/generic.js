// lib/importers/sources/generic.js

export const genericImporter = {
  id: "generic",
  canParse(raw) {
    return !!raw;
  },
  parse(raw) {
    // If user uploads a single thread in normalized format, accept it.
    if (raw && Array.isArray(raw.threads)) return { source: raw.source || "unknown", threads: raw.threads };

    // If user uploads {messages:[...]} treat as one thread.
    if (raw && Array.isArray(raw.messages)) {
      const messages = raw.messages
        .map((m) => ({
          role: m.role || m.author?.role,
          content: m.content || m.text || "",
          ts: m.ts || m.created_at || Date.now() / 1000,
        }))
        .filter((m) => (m.role === "user" || m.role === "assistant") && m.content);

      return {
        source: "unknown",
        threads: [{
          sourceThreadId: raw.id || `unknown-${Date.now()}`,
          title: raw.title || "Imported Chat",
          createdAt: Date.now() / 1000,
          messages,
        }],
      };
    }

    return { source: "unknown", threads: [] };
  },
};
