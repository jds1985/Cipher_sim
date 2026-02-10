// cipher_os/runtime/osContext.js
// Builds the canonical Cipher OS Context object (Phase 2)
// Now includes Weight Engine (prioritized recall)

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

/* =====================================================
   🪐 WEIGHT ENGINE
   Strongest memories survive.
===================================================== */
function weightMemories(nodes = []) {
  if (!Array.isArray(nodes)) return [];

  const sorted = nodes.sort(
    (a, b) => (b.reinforcementCount || 0) - (a.reinforcementCount || 0)
  );

  const top = sorted.slice(0, 25);

  console.log("🪐 weight engine selected:", top.map((n) => n.id));

  return top;
}

export function buildOSContext({
  requestId,
  userId,
  userName = "Jim",
  userMessage,
  uiHistory,
  longTermHistory,
  memoryNodes = [], // ⭐ NEW
}) {
  const trimmedHistory = sanitizeUiHistory(uiHistory);

  const mergedHistory = [
    ...(Array.isArray(longTermHistory) ? longTermHistory : []),
    ...uiToMemoryEntries(trimmedHistory),
  ].slice(-50);

  const prioritizedNodes = weightMemories(memoryNodes);

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
      nodes: prioritizedNodes, // ⭐ FILTERED BY STRENGTH
    },
    input: {
      userMessage: String(userMessage || "").trim(),
    },
  };
}
