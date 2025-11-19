// cipher_core/guard.js
// Simple guard layer for Cipher 4.1

export async function runGuard(message) {
  if (!message) return "";

  let text = String(message).trim();

  // Hard cap to avoid huge payloads
  const MAX_LEN = 4000;
  if (text.length > MAX_LEN) {
    text = text.slice(0, MAX_LEN);
  }

  // Strip weird control characters
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  return text;
}
