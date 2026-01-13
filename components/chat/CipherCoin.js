// components/chat/CipherCoin.js
// Single source of truth for Cipher Coin + rewards + ledger.

const COIN_KEY = "cipher_coin_balance";
const LEDGER_KEY = "cipher_coin_ledger";

// cooldown/claim keys
const LAST_SHARE_KEY = "cipher_last_share_reward";
const LAST_DAILY_KEY = "cipher_last_daily_reward";

// referral
const REF_CLAIMED_PREFIX = "cipher_ref_claimed_"; // + refCode
const REF_LAST_SEEN = "cipher_ref_last_seen";

// optional identity (for future)
const EMAIL_KEY = "cipher_user_email";
const EMAIL_BONUS_KEY = "cipher_email_bonus_claimed";

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

function hasWindow() {
  return typeof window !== "undefined";
}

// ===== ledger =====
export function getLedger(limit = 50) {
  if (!hasWindow()) return [];
  const raw = localStorage.getItem(LEDGER_KEY);
  const arr = safeParse(raw, []);
  return Array.isArray(arr) ? arr.slice(0, limit) : [];
}

export function addLedgerEntry(entry) {
  if (!hasWindow()) return [];
  const current = getLedger(200);
  const next = [{ ...entry, ts: entry.ts || nowIso() }, ...current].slice(0, 200);
  localStorage.setItem(LEDGER_KEY, JSON.stringify(next));
  return next;
}

// ===== balance =====
export function getCipherCoin() {
  if (!hasWindow()) return 0;
  const raw = localStorage.getItem(COIN_KEY);
  return raw ? Number(raw) : 0;
}

export function setCipherCoin(next) {
  if (!hasWindow()) return 0;
  const n = Math.max(0, clampInt(next));
  localStorage.setItem(COIN_KEY, String(n));
  return n;
}

export function addCipherCoin(amount, reason = "unknown", meta = {}) {
  if (!hasWindow()) return 0;
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
  if (!hasWindow()) return { ok: false, balance: 0 };
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

// ===== reward rules =====
const DAY_MS = 24 * 60 * 60 * 1000;

export function canRewardShare() {
  if (!hasWindow()) return false;
  const last = localStorage.getItem(LAST_SHARE_KEY);
  if (!last) return true;
  return Date.now() - Number(last) >= DAY_MS;
}

export function rewardShare() {
  if (!canRewardShare()) return { ok: false, reason: "cooldown" };

  localStorage.setItem(LAST_SHARE_KEY, String(Date.now()));
  const balance = addCipherCoin(2, "share", { cooldown: "24h" });
  return { ok: true, earned: 2, balance };
}

export function canRewardDaily() {
  if (!hasWindow()) return false;
  const last = localStorage.getItem(LAST_DAILY_KEY);
  if (!last) return true;
  return Date.now() - Number(last) >= DAY_MS;
}

export function rewardDaily() {
  if (!canRewardDaily()) return { ok: false, reason: "cooldown" };

  localStorage.setItem(LAST_DAILY_KEY, String(Date.now()));
  const balance = addCipherCoin(1, "daily", { cooldown: "24h" });
  return { ok: true, earned: 1, balance };
}

// ===== referral =====
// Claim rule: if user opens with ?ref=CODE and hasn't claimed that code before,
// grant +3 once per code per browser.
export function claimReferral(refCodeRaw) {
  if (!hasWindow()) return { ok: false, reason: "no_window" };

  const refCode = String(refCodeRaw || "").trim();
  if (!refCode) return { ok: false, reason: "no_ref" };

  localStorage.setItem(REF_LAST_SEEN, refCode);

  const claimedKey = `${REF_CLAIMED_PREFIX}${refCode}`;
  if (localStorage.getItem(claimedKey)) {
    return { ok: false, reason: "already_claimed" };
  }

  localStorage.setItem(claimedKey, "true");
  const balance = addCipherCoin(3, "referral", { ref: refCode });
  return { ok: true, earned: 3, balance, ref: refCode };
}

// ===== email bonus =====
export function setUserEmail(email) {
  if (!hasWindow()) return null;
  const v = String(email || "").trim();
  if (!v) return null;
  localStorage.setItem(EMAIL_KEY, v);
  return v;
}

export function getUserEmail() {
  if (!hasWindow()) return null;
  return localStorage.getItem(EMAIL_KEY) || null;
}

// Award +5 once per browser when email gets set the first time.
export function rewardEmailBonus(email) {
  if (!hasWindow()) return { ok: false, reason: "no_window" };

  const v = String(email || "").trim();
  if (!v) return { ok: false, reason: "no_email" };

  const already = localStorage.getItem(EMAIL_BONUS_KEY);
  if (already) return { ok: false, reason: "already_claimed" };

  setUserEmail(v);
  localStorage.setItem(EMAIL_BONUS_KEY, "true");
  const balance = addCipherCoin(5, "email_bonus", { email: v });
  return { ok: true, earned: 5, balance };
}
