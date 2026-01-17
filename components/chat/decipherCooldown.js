// components/chat/decipherCooldown.js

const STORAGE_KEY = "decipher_last_used";
const COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes (tweak later)

export function canUseDecipher() {
  if (typeof window === "undefined") {
    return { allowed: true, remainingMs: 0 };
  }

  const last = Number(localStorage.getItem(STORAGE_KEY));
  if (!last) {
    return { allowed: true, remainingMs: 0 };
  }

  const elapsed = Date.now() - last;
  const remaining = COOLDOWN_MS - elapsed;

  if (remaining <= 0) {
    return { allowed: true, remainingMs: 0 };
  }

  return {
    allowed: false,
    remainingMs: remaining,
  };
}

export function recordDecipherUse() {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, String(Date.now()));
}

export function formatRemaining(ms) {
  const sec = Math.ceil(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.ceil(sec / 60);
  return `${min}m`;
}

export const DECIPHER_COOLDOWN_MESSAGE = (ms) =>
  `Decipher needs a moment. Try again in ${formatRemaining(ms)}.`;
