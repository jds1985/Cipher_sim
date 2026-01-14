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

function isBrowser() {
  return typeof window !== "undefined";
}

// ===== ledger =====
export function getLedger(limit = 50) {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(LEDGER_KEY);
  const arr = safeParse(raw, []);
  return Array.isArray(arr) ? arr.slice(0, limit) : [];
}

export function addLedgerEntry(entry) {
  if (!isBrowser()) return [];
  const current = getLedger(200);
  const next = [{ ...entry, ts: entry.ts || nowIso() }, ...current].slice(0, 200);
  localStorage.setItem(LEDGER_KEY, JSON.stringify(next));
  return next;
}

// ===== balance =====
export function getCipherCoin() {
  if (!isBrowser()) return 0;
  const raw = localStorage.getItem(COIN_KEY);
  return raw ? Number(raw) : 0;
}

export function setCipherCoin(next) {
  if (!isBrowser()) return 0;
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
  if (!isBrowser()) return { ok: false };
  const last = localStorage.getItem(LAST_DAILY_KEY);
  if (last && Date.now() - Number(last) < DAY_MS) {
    return { ok: false, reason: "cooldown" };
  }

  localStorage.setItem(LAST_DAILY_KEY, String(Date.now()));
  const balance = addCipherCoin(1, "daily", { cooldown: "24h" });
  return { ok: true, earned: 1, balance };
}

export function rewardShare() {
  if (!isBrowser()) return { ok: false };
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
  if (!isBrowser()) return { ok: false };
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
  if (!isBrowser()) return null;
  return localStorage.getItem(EMAIL_KEY) || null;
}

export function rewardEmailBonus(email) {
  if (!isBrowser()) return { ok: false };
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
  if (!isBrowser()) return {};
  return safeParse(localStorage.getItem(ENTITLEMENTS_KEY), {});
}

export function hasEntitlement(key) {
  const ent = getEntitlements();
  return Boolean(ent && ent[key]);
}

export function purchaseStarterPack() {
  const ENT_KEY = "starter_pack";
  const COST = 25;

  if (!isBrowser()) return { ok: false, reason: "ssr" };
  if (hasEntitlement(ENT_KEY)) return { ok: false, reason: "already_owned" };

  const spend = spendCipherCoin(COST, "purchase", { item: ENT_KEY });
  if (!spend.ok) return { ok: false, reason: "insufficient_funds", balance: spend.balance };

  const ent = getEntitlements();
  localStorage.setItem(ENTITLEMENTS_KEY, JSON.stringify({ ...ent, [ENT_KEY]: true }));

  addLedgerEntry({
    type: "entitlement",
    reason: "unlock",
    amount: 0,
    balanceAfter: spend.balance,
    meta: { item: ENT_KEY },
  });

  return { ok: true, balance: spend.balance, cost: COST, item: ENT_KEY };
}

// ==============================
// CONSUMABLES (STACKABLE)
// ==============================
export function getConsumables() {
  if (!isBrowser()) return {};
  return safeParse(localStorage.getItem(CONSUMABLES_KEY), {});
}

function setConsumables(next) {
  if (!isBrowser()) return;
  localStorage.setItem(CONSUMABLES_KEY, JSON.stringify(next));
}

export function getResetTokenCount() {
  const cons = getConsumables();
  return clampInt(cons.decipher_reset || 0);
}

// Grants tokens without spending (admin/debug/internal)
export function grantResetToken(count = 1) {
  if (!isBrowser()) return 0;
  const cons = getConsumables();
  const next = {
    ...cons,
    decipher_reset: clampInt((cons.decipher_reset || 0) + clampInt(count)),
  };
  setConsumables(next);

  addLedgerEntry({
    type: "grant",
    reason: "decipher_reset_token",
    amount: clampInt(count),
    meta: { total: next.decipher_reset },
  });

  return next.decipher_reset;
}

// ✅ Proper purchase function (spends coin + grants token)
export function purchaseResetToken(count = 1) {
  const COST_EACH = 10;
  const qty = Math.max(1, clampInt(count));
  const totalCost = COST_EACH * qty;

  if (!isBrowser()) return { ok: false, reason: "ssr" };

  const spend = spendCipherCoin(totalCost, "purchase", {
    item: "decipher_reset_token",
    qty,
    costEach: COST_EACH,
  });
  if (!spend.ok) return { ok: false, reason: "insufficient_funds", balance: spend.balance };

  const total = grantResetToken(qty);

  addLedgerEntry({
    type: "consumable_purchase",
    reason: "decipher_reset_token",
    amount: 0,
    balanceAfter: spend.balance,
    meta: { qty, total, cost: totalCost },
  });

  return { ok: true, balance: spend.balance, cost: totalCost, qty, total };
}

export function consumeResetToken() {
  if (!isBrowser()) return { ok: false, reason: "ssr" };
  const cons = getConsumables();
  const cur = clampInt(cons.decipher_reset || 0);
  if (cur <= 0) return { ok: false, reason: "none" };

  const next = { ...cons, decipher_reset: Math.max(0, cur - 1) };
  setConsumables(next);

  addLedgerEntry({
    type: "consume",
    reason: "decipher_reset_token",
    amount: 0,
    meta: { remaining: next.decipher_reset },
  });

  return { ok: true, remaining: next.decipher_reset };
}
