// cipher_core/guard.js
// Guard 10.0 — Lightweight, stable text safety filter

export async function runGuard(input = "") {
  if (typeof input !== "string") {
    return {
      flagged: true,
      reason: "Message must be a string.",
      cleaned: "",
    };
  }

  const cleaned = input.trim();

  if (!cleaned) {
    return {
      flagged: true,
      reason: "Empty or invalid message.",
      cleaned: "",
    };
  }

  // BASIC BLOCK LIST (expand anytime)
  const blockedPhrases = [
    "kill myself",
    "kill yourself",
    "suicide",
    "self harm",
    "harm yourself",
  ];

  const lower = cleaned.toLowerCase();

  for (const phrase of blockedPhrases) {
    if (lower.includes(phrase)) {
      return {
        flagged: true,
        reason: `Blocked keyword detected: "${phrase}"`,
        cleaned: "", // Do NOT pass anything unsafe to the LLM
      };
    }
  }

  // SAFE
  return {
    flagged: false,
    cleaned,
  };
}
