// components/chat/CipherCoin.js
// Single source of truth for Cipher Coin + rewards + ledger + store entitlements + consumables.

const COIN_KEY = "cipher_coin_balance";
const LEDGER_KEY = "cipher_coin_ledger";

// cooldown/claim keys
const LAST_SHARE_KEY = "cipher_last_share_reward";
const LAST_DAILY_KEY = "cipher_last_daily_reward";

// referral
const REF_CLAIMED_PREFIX = "cipher_ref_claimed_";
const REF_LAST_SEEN = "cipher_ref_last_seen";

// optional identity
const EMAIL_KEY = "cipher_user_email";

// store
const ENTITLEMENTS_KEY = "cipher_store_entitlements";
const CONSUMABLES_KEY = "cipher_store_consumables";

// ===== helpers =====
function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function clampInt(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.trunc(x);
}

// ===== ledger =====
export function getLedger(limit = 50) {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LEDGER_KEY);
  const arr = safeParse(raw, []);
  return Array.isArray(arr) ? arr.slice(0, limit) : [];
}

export function addLedgerEntry(entry) {
  if (typeof window === "undefined") return [];
  const current = getLedger(200);
  const next = [{ ...entry, ts: entry.ts || nowIso() }, ...current].slice(0, 200);
  localStorage.setItem(LEDGER_KEY, JSON.stringify(next));
  return next;
}

// ===== balance =====
export function getCipherCoin() {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(COIN_KEY);
  return raw ? Number(raw) : 0;
}

export function setCipherCoin(next) {
  if (typeof window === "undefined") return 0;
  const n = Math.max(0, clampInt(next));
  localStorage.setItem(COIN_KEY, String(n));
  return n;
}

export function addCipherCoin(amount, reason = "unknown", meta = {}) {
  const current = getCipherCoin();
  const next = setCipherCoin(current + clampInt(amount));

  addLedgerEntry({
    type: "earn",
    reason,
    amount: clampInt(amount),
    balanceAfter: next,
    meta,
  });

  return next;
}

export function spendCipherCoin(amount, reason = "spend", meta = {}) {
  const amt = Math.max(0, clampInt(amount));
  const current = getCipherCoin();
  if (current < amt) return { ok: false, balance: current };

  const next = setCipherCoin(current - amt);

  addLedgerEntry({
    type: "spend",
    reason,
    amount: -amt,
    balanceAfter: next,
    meta,
  });

  return { ok: true, balance: next };
}

// ===== rewards =====
const DAY_MS = 24 * 60 * 60 * 1000;

export function rewardDaily() {
  if (typeof window === "undefined") return { ok: false };
  const last = localStorage.getItem(LAST_DAILY_KEY);
  if (last && Date.now() - Number(last) < DAY_MS) {
    return { ok: false, reason: "cooldown" };
  }

  localStorage.setItem(LAST_DAILY_KEY, String(Date.now()));
  const balance = addCipherCoin(1, "daily", { cooldown: "24h" });
  return { ok: true, earned: 1, balance };
}

export function rewardShare() {
  if (typeof window === "undefined") return { ok: false };
  const last = localStorage.getItem(LAST_SHARE_KEY);
  if (last && Date.now() - Number(last) < DAY_MS) {
    return { ok: false, reason: "cooldown" };
  }

  localStorage.setItem(LAST_SHARE_KEY, String(Date.now()));
  const balance = addCipherCoin(2, "share", { cooldown: "24h" });
  return { ok: true, earned: 2, balance };
}

// ===== referral =====
export function claimReferral(refCodeRaw) {
  if (typeof window === "undefined") return { ok: false };
  const refCode = String(refCodeRaw || "").trim();
  if (!refCode) return { ok: false };

  const claimedKey = `${REF_CLAIMED_PREFIX}${refCode}`;
  if (localStorage.getItem(claimedKey)) {
    return { ok: false, reason: "already_claimed" };
  }

  localStorage.setItem(REF_LAST_SEEN, refCode);
  localStorage.setItem(claimedKey, "true");

  const balance = addCipherCoin(3, "referral", { ref: refCode });
  return { ok: true, earned: 3, balance };
}

// ===== email bonus =====
const EMAIL_BONUS_KEY = "cipher_email_bonus_claimed";

export function getUserEmail() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(EMAIL_KEY) || null;
}

export function rewardEmailBonus(email) {
  if (typeof window === "undefined") return { ok: false };
  const v = String(email || "").trim();
  if (!v) return { ok: false };

  if (localStorage.getItem(EMAIL_BONUS_KEY)) {
    localStorage.setItem(EMAIL_KEY, v);
    return { ok: false, reason: "already_claimed" };
  }

  localStorage.setItem(EMAIL_KEY, v);
  localStorage.setItem(EMAIL_BONUS_KEY, "true");

  const balance = addCipherCoin(5, "email_bonus", { email: v });
  return { ok: true, earned: 5, balance };
}

// ==============================
// ENTITLEMENTS (PERMANENT)
// ==============================
export function getEntitlements() {
  if (typeof window === "undefined") return {};
  return safeParse(localStorage.getItem(ENTITLEMENTS_KEY), {});
}

export function hasEntitlement(key) {
  return Boolean(getEntitlements()[key]);
}

export function purchaseStarterPack() {
  const ENT_KEY = "starter_pack";
  const COST = 25;

  if (hasEntitlement(ENT_KEY)) {
    return { ok: false, reason: "already_owned" };
  }

  const spend = spendCipherCoin(COST, "purchase", { item: ENT_KEY });
  if (!spend.ok) return { ok: false, reason: "insufficient_funds" };

  const ent = getEntitlements();
  localStorage.setItem(
    ENTITLEMENTS_KEY,
    JSON.stringify({ ...ent, [ENT_KEY]: true })
  );

  addLedgerEntry({
    type: "entitlement",
    reason: "unlock",
    balanceAfter: spend.balance,
    meta: { item: ENT_KEY },
  });

  return { ok: true, balance: spend.balance };
}

// ==============================
// CONSUMABLES (STACKABLE)
// ==============================
export function getConsumables() {
  if (typeof window === "undefined") return {};
  return safeParse(localStorage.getItem(CONSUMABLES_KEY), {});
}

export function getResetTokenCount() {
  return getConsumables().decipher_reset || 0;
}

function setConsumables(next) {
  localStorage.setItem(CONSUMABLES_KEY, JSON.stringify(next));
}

export function grantResetToken(count = 1) {
  const cons = getConsumables();
  const next = {
    ...cons,
    decipher_reset: clampInt((cons.decipher_reset || 0) + count),
  };
  setConsumables(next);

  addLedgerEntry({
    type: "grant",
    reason: "decipher_reset_token",
    amount: count,
    meta: { total: next.decipher_reset },
  });

  return next.decipher_reset;
}

export function consumeResetToken() {
  const cons = getConsumables();
  if (!cons.decipher_reset) return { ok: false };

  const next = {
    ...cons,
    decipher_reset: Math.max(0, cons.decipher_reset - 1),
  };
  setConsumables(next);

  addLedgerEntry({
    type: "consume",
    reason: "decipher_reset_token",
    meta: { remaining: next.decipher_reset },
  });

  return { ok: true, remaining: next.decipher_reset };
}
