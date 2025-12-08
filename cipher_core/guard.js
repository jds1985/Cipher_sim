// cipher_core/guard.js
// Cipher Guard Layer – Object-Based Output (Required by chat.js)

export async function runGuard(message) {
  if (!message) {
    return {
      flagged: false,
      cleaned: "",
      reason: null,
    };
  }

  // Convert and trim
  let text = String(message).trim();

  // Hard cap to avoid giant payloads
  const MAX_LEN = 4000;
  if (text.length > MAX_LEN) {
    text = text.slice(0, MAX_LEN);
  }

  // Strip weird control characters
  const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // *** OPTIONAL SAFETY CHECKS ***
  // You can expand this later, but for now we keep it extremely simple.
  const blockedPatterns = [/bomb/i, /kill/i, /suicide/i];

  for (const pattern of blockedPatterns) {
    if (pattern.test(cleaned)) {
      return {
        flagged: true,
        cleaned,
        reason: "Contains restricted language",
      };
    }
  }

  // Safe to continue
  return {
    flagged: false,
    cleaned,
    reason: null,
  };
}
