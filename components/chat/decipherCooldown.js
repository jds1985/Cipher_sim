// components/chat/decipherCooldown.js

const STORAGE_KEY = "decipher_last_use";
const COOLDOWN_MS = 60 * 1000; // 60 seconds — adjust later

export function canUseDecipher() {
  if (typeof window === "undefined") {
    return { allowed: true, remainingMs: 0 };
  }

  const last = Number(localStorage.getItem(STORAGE_KEY) || 0);
  const now = Date.now();
  const remaining = COOLDOWN_MS - (now - last);

  if (remaining > 0) {
    return { allowed: false, remainingMs: remaining };
  }

  return { allowed: true, remainingMs: 0 };
}

export function recordDecipherUse() {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, String(Date.now()));
}

export function formatRemaining(ms) {
  const sec = Math.ceil(ms / 1000);
  return `${sec}s`;
}

export const DECIPHER_COOLDOWN_MESSAGE =
  "Decipher is cooling down. Dropping back to Cipher.";
