// cipher_os/runtime/osContext.js
// Builds the canonical Cipher OS Context object (Phase 1)

function sanitizeUiHistory(history) {
  const HISTORY_LIMIT = 12;
  if (!Array.isArray(history)) return [];
  return history.slice(-HISTORY_LIMIT).map((m) => ({
    role: m?.role === "decipher" ? "assistant" : (m?.role || "assistant"),
    content: String(m?.content ?? ""),
  }));
}

// Convert UI history into memory-entry shape so core/stability can read it safely
function uiToMemoryEntries(ui) {
  return ui.map((m) => ({
    type: "interaction",
    role: m.role,
    content: m.content,
    importance: "low",
    timestamp: Date.now(),
  }));
}

export function buildOSContext({
  requestId,
  userId,
  userName = "Jim",
  userMessage,
  uiHistory,
  longTermHistory,
}) {
  const trimmedHistory = sanitizeUiHistory(uiHistory);

  const mergedHistory = [
    ...(Array.isArray(longTermHistory) ? longTermHistory : []),
    ...uiToMemoryEntries(trimmedHistory),
  ].slice(-50);

  return {
    requestId,
    user: {
      id: userId,
      name: userName,
    },
    session: {
      theme: null,
    },
    memory: {
      uiHistory: trimmedHistory,
      mergedHistory,
      longTermHistory: Array.isArray(longTermHistory) ? longTermHistory : [],
    },
    input: {
      userMessage: String(userMessage || "").trim(),
    },
  };
}
