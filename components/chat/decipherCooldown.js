// components/chat/decipherCooldown.js

export function canUseDecipher() {
  return {
    allowed: true,
    remainingMs: 0,
  };
}

export function recordDecipherUse() {
  // cooldown disabled
}

export const DECIPHER_COOLDOWN_MESSAGE =
  "Decipher cooldown temporarily disabled.";

export function formatRemaining() {
  return "";
}
