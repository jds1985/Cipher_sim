/* ===============================
   DECIPHER ENGINE
   Handles: cooldowns, tiers, bursts
================================ */

const DECIPHER_LAST_KEY = "cipher_decipher_last";
const DECIPHER_BURST_KEY = "cipher_decipher_burst";
const USER_TIER_KEY = "cipher_user_tier";

const DEFAULT_TIER = "free"; // free | plus | premium

const COOLDOWNS = {
  free: 30 * 60 * 1000,
  plus: 15 * 60 * 1000,
};

const PREMIUM_BURST_WINDOW = 10 * 60 * 1000;
const PREMIUM_BURST_COUNT = 3;
const PREMIUM_COOLDOWN = 10 * 60 * 1000;

export const DECIPHER_COOLDOWN_MESSAGE =
  "Cool down.\n\nYou don’t need me right now.\nGo do something else.\nCome back later.";

function now() {
  return Date.now();
}

function getTier() {
  if (typeof window === "undefined") return DEFAULT_TIER;
  const t = localStorage.getItem(USER_TIER_KEY);
  return ["free", "plus", "premium"].includes(t) ? t : DEFAULT_TIER;
}

function getLast() {
  return Number(localStorage.getItem(DECIPHER_LAST_KEY) || 0);
}

function setLast(ts) {
  localStorage.setItem(DECIPHER_LAST_KEY, String(ts));
}

function getBursts() {
  try {
    return JSON.parse(localStorage.getItem(DECIPHER_BURST_KEY) || "[]");
  } catch {
    return [];
  }
}

function setBursts(arr) {
  localStorage.setItem(DECIPHER_BURST_KEY, JSON.stringify(arr));
}

export function canUseDecipher() {
  if (typeof window === "undefined") return { allowed: true, remaining: 0 };

  const tier = getTier();
  const t = now();

  if (tier === "premium") {
    const last = getLast();
    if (last && t - last < PREMIUM_COOLDOWN) {
      return { allowed: false, remaining: PREMIUM_COOLDOWN - (t - last) };
    }

    const bursts = getBursts().filter((b) => t - b < PREMIUM_BURST_WINDOW);
    if (bursts.length >= PREMIUM_BURST_COUNT) {
      setLast(t);
      setBursts(bursts);
      return { allowed: false, remaining: PREMIUM_COOLDOWN };
    }

    return { allowed: true, remaining: 0 };
  }

  const cd = COOLDOWNS[tier] || COOLDOWNS.free;
  const last = getLast();
  if (last && t - last < cd) {
    return { allowed: false, remaining: cd - (t - last) };
  }

  return { allowed: true, remaining: 0 };
}

export function recordDecipherUse() {
  const tier = getTier();
  const t = now();

  if (tier === "premium") {
    const bursts = getBursts().filter((b) => t - b < PREMIUM_BURST_WINDOW);
    bursts.push(t);
    setBursts(bursts);
    return;
  }

  setLast(t);
}

export function resetDecipher() {
  localStorage.removeItem(DECIPHER_LAST_KEY);
  localStorage.removeItem(DECIPHER_BURST_KEY);
}
