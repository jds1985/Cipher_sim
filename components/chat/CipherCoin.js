// components/chat/CipherCoin.js

const COIN_KEY = "cipher_coin_balance";

/* ===============================
   CORE COIN HELPERS
================================ */

export function getCipherCoin() {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(COIN_KEY);
  const val = Number(raw);
  return Number.isFinite(val) ? val : 0;
}

export function setCipherCoin(amount) {
  if (typeof window === "undefined") return;
  localStorage.setItem(COIN_KEY, String(Math.max(0, Math.floor(amount))));
}

export function addCipherCoin(amount = 1) {
  if (typeof window === "undefined") return;
  const current = getCipherCoin();
  setCipherCoin(current + amount);
}

export function spendCipherCoin(amount = 1) {
  if (typeof window === "undefined") return false;
  const current = getCipherCoin();
  if (current < amount) return false;
  setCipherCoin(current - amount);
  return true;
}

/* ===============================
   REWARD PRESETS (SAFE DEFAULTS)
================================ */

export const COIN_REWARDS = {
  share_link: 5,       // user shares app
  referral_signup: 25, // friend signs up
  daily_return: 1,     // comes back tomorrow
  beta_bonus: 50,      // early access reward
};

/* ===============================
   OPTIONAL: SAFE GRANT WRAPPER
================================ */

export function grantCipherCoin(reason) {
  const amount = COIN_REWARDS[reason];
  if (!amount) return false;
  addCipherCoin(amount);
  return amount;
}
