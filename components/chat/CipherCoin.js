// components/chat/CipherCoin.js

const COIN_KEY = "cipher_coin_balance";
const LAST_SHARE_KEY = "cipher_last_share_reward";

export function getCipherCoin() {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(COIN_KEY);
  return raw ? Number(raw) : 0;
}

export function setCipherCoin(amount) {
  localStorage.setItem(COIN_KEY, String(amount));
}

export function addCipherCoin(amount, reason = "") {
  const current = getCipherCoin();
  const next = Math.max(0, current + amount); // 🔒 never negative
  setCipherCoin(next);

  console.log(`[CipherCoin] +${amount}`, reason);
  return next;
}

export function canRewardShare() {
  const last = localStorage.getItem(LAST_SHARE_KEY);
  if (!last) return true;

  const elapsed = Date.now() - Number(last);
  return elapsed >= 24 * 60 * 60 * 1000; // 24h cooldown
}

export function rewardShare() {
  if (!canRewardShare()) return false;

  localStorage.setItem(LAST_SHARE_KEY, String(Date.now()));
  addCipherCoin(2, "share");
  return true;
}
