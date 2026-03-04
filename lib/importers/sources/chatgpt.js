// lib/importers/sources/chatgpt.js

function safeTextFromContent(content) {
  // ChatGPT exports often store text in content.parts
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content.parts)) return content.parts.filter(Boolean).join("\n");
  if (Array.isArray(content)) return content.filter(Boolean).join("\n");
  return "";
}

function isChatGPTExport(raw) {
  // Typical: { conversations: [...] } OR { mapping: {...} } inside conversations
  return (
    (raw && Array.isArray(raw.conversations)) ||
    (raw && raw.mapping && typeof raw.mapping === "object") ||
    (raw && Array.isArray(raw)) // sometimes export is an array of conversations
  );
}

function parseConversationObject(conv) {
  // Two common patterns:
  // A) conv.mapping tree with message nodes
  // B) conv.messages array
  const title = conv.title || conv.name || "Imported Chat";
  const createdAt = conv.create_time || conv.created_at || conv.createdAt || Date.now() / 1000;

  let messages = [];

  // Pattern B: messages array
  if (Array.isArray(conv.messages)) {
    messages = conv.messages
      .map((m) => ({
        role: m.role || m.author?.role,
        content: safeTextFromContent(m.content),
        ts: m.create_time || m.created_at || m.ts || createdAt,
      }))
      .filter((m) => (m.role === "user" || m.role === "assistant") && m.content);
  }

  // Pattern A: mapping tree
  if ((!messages || messages.length === 0) && conv.mapping && typeof conv.mapping === "object") {
    const nodes = Object.values(conv.mapping);

    // Grab nodes that have a message payload
    const extracted = nodes
      .map((n) => {
        const msg = n?.message;
        if (!msg) return null;
        const role = msg.author?.role;
        const content = safeTextFromContent(msg.content);
        const ts = msg.create_time || createdAt;
        return { role, content, ts };
      })
      .filter(Boolean)
      .filter((m) => (m.role === "user" || m.role === "assistant") && m.content);

    // mapping order isn't guaranteed; best-effort sort by timestamp
    messages = extracted.sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));
  }

  const sourceThreadId = conv.id || conv.conversation_id || conv.uuid || `${title}-${createdAt}`;

  return {
    sourceThreadId,
    title,
    createdAt,
    messages,
  };
}

export const chatgptImporter = {
  id: "chatgpt",
  canParse(raw) {
    return isChatGPTExport(raw);
  },
  parse(raw) {
    const conversations = Array.isArray(raw)
      ? raw
      : Array.isArray(raw.conversations)
        ? raw.conversations
        : raw.mapping
          ? [raw]
          : [];

    const threads = conversations
      .map(parseConversationObject)
      .filter((t) => t.messages && t.messages.length > 0);

    return { source: "chatgpt", threads };
  },
};
