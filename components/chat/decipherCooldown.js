// components/chat/decipherCooldown.js

// Where we store client-side cooldown state
export const DECIPHER_LAST_KEY = "cipher_decipher_last";
export const DECIPHER_BURST_KEY = "cipher_decipher_burst";
export const USER_TIER_KEY = "cipher_user_tier"; // "free" | "plus" | "premium"

export const DEFAULT_TIER = "free";

export const DECIPHER_COOLDOWNS_MS = {
  free: 30 * 60 * 1000,
  plus: 15 * 60 * 1000,
};

export const PREMIUM_BURST_WINDOW_MS = 10 * 60 * 1000;
export const PREMIUM_BURST_COUNT = 3;
export const PREMIUM_COOLDOWN_MS = 10 * 60 * 1000;

export const DECIPHER_COOLDOWN_MESSAGE =
  "Cool down.\n\nYou don’t need me every five seconds.\nGo do something real for a bit.\nThen come back if you still feel like it.";

// Store entitlement key (must match CipherCoin.js)
const ENTITLEMENTS_KEY = "cipher_store_entitlements";
const STARTER_PACK_KEY = "starter_pack";

/* ===============================
   HELPERS
================================ */

function safeParseJSON(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function formatRemaining(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function getTier() {
  if (typeof window === "undefined") return DEFAULT_TIER;
  const t = localStorage.getItem(USER_TIER_KEY);
  if (t === "free" || t === "plus" || t === "premium") return t;
  return DEFAULT_TIER;
}

function getNow() {
  return Date.now();
}

function getBurstTimestamps() {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(DECIPHER_BURST_KEY);
  const arr = safeParseJSON(raw, []);
  return Array.isArray(arr) ? arr.filter((n) => typeof n === "number") : [];
}

function setBurstTimestamps(arr) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DECIPHER_BURST_KEY, JSON.stringify(arr));
}

function getLastDecipherAt() {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(DECIPHER_LAST_KEY);
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function setLastDecipherAt(ts) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DECIPHER_LAST_KEY, String(ts));
}

/* ===============================
   ENTITLEMENTS
================================ */

function hasStarterPack() {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(ENTITLEMENTS_KEY);
  const ent = safeParseJSON(raw, {});
  return Boolean(ent && ent[STARTER_PACK_KEY]);
}

function getCooldownMsForTier(tier) {
  // Premium ignores starter discount
  if (tier === "premium") return PREMIUM_COOLDOWN_MS;

  const base = DECIPHER_COOLDOWNS_MS[tier] ?? DECIPHER_COOLDOWNS_MS.free;

  // Starter Pack = 50% reduction (min 1 min safety)
  if (hasStarterPack()) {
    return Math.max(60 * 1000, Math.floor(base * 0.5));
  }

  return base;
}

/* ===============================
   CORE API
================================ */

/**
 * Returns:
 * { allowed: boolean, remainingMs: number, reason: string }
 */
export function canUseDecipher() {
  if (typeof window === "undefined") {
    return { allowed: true, remainingMs: 0, reason: "" };
  }

  const tier = getTier();
  const now = getNow();

  // Premium burst logic
  if (tier === "premium") {
    const last = getLastDecipherAt();
    const lastCooldownRemaining = last
      ? Math.max(0, last + PREMIUM_COOLDOWN_MS - now)
      : 0;

    if (lastCooldownRemaining > 0) {
      return {
        allowed: false,
        remainingMs: lastCooldownRemaining,
        reason: "premium_cooldown",
      };
    }

    const stamps = getBurstTimestamps();
    const recent = stamps.filter((t) => now - t <= PREMIUM_BURST_WINDOW_MS);

    if (recent.length >= PREMIUM_BURST_COUNT) {
      setLastDecipherAt(now);
      setBurstTimestamps(recent);
      return {
        allowed: false,
        remainingMs: PREMIUM_COOLDOWN_MS,
        reason: "premium_burst_cap",
      };
    }

    return { allowed: true, remainingMs: 0, reason: "" };
  }

  // Free / Plus
  const cooldownMs = getCooldownMsForTier(tier);
  const last = getLastDecipherAt();
  const remaining = last ? Math.max(0, last + cooldownMs - now) : 0;

  if (remaining > 0) {
    return { allowed: false, remainingMs: remaining, reason: "cooldown" };
  }

  return { allowed: true, remainingMs: 0, reason: "" };
}

export function recordDecipherUse() {
  if (typeof window === "undefined") return;

  const tier = getTier();
  const now = getNow();

  if (tier === "premium") {
    const stamps = getBurstTimestamps();
    const recent = stamps.filter((t) => now - t <= PREMIUM_BURST_WINDOW_MS);
    recent.push(now);
    setBurstTimestamps(recent);
    return;
  }

  setLastDecipherAt(now);
}

/* ===============================
   NEW: RESET API (FOR STORE)
================================ */

/**
 * Completely resets Decipher cooldown state.
 * Call this AFTER spending Cipher Coin.
 */
export function resetDecipherCooldown() {
  if (typeof window === "undefined") return false;

  localStorage.removeItem(DECIPHER_LAST_KEY);
  localStorage.removeItem(DECIPHER_BURST_KEY);

  return true;
}
