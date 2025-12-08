// cipher_core/guard.js
// Simple guard layer that always returns an object with a 'flagged' field.

export async function runGuard(message) {
  if (!message || typeof message !== "string") {
    return { flagged: true, reason: "Invalid message type." };
  }

  let text = message.trim();

  // Hard cap to avoid massive payloads
  const MAX_LEN = 4000;
  if (text.length > MAX_LEN) {
    text = text.slice(0, MAX_LEN);
  }

  // Strip weird control chars
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // IMPORTANT: Always return an object
  return {
    flagged: false,
    cleaned: text,
  };
}
