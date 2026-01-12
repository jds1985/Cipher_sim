const COIN_KEY = "cipher_coin_balance";
const LAST_SHARE_KEY = "cipher_last_share_reward";
const LAST_DAILY_KEY = "cipher_last_daily_reward";

export function getCipherCoin() {
  return Number(localStorage.getItem(COIN_KEY) || 0);
}

export function addCipherCoin(amount, reason = "") {
  const next = getCipherCoin() + amount;
  localStorage.setItem(COIN_KEY, String(next));
  console.log(`[CipherCoin] +${amount}`, reason);
  return next;
}

/* ===== SHARE REWARD ===== */

export function canRewardShare() {
  const last = localStorage.getItem(LAST_SHARE_KEY);
  if (!last) return true;
  return Date.now() - Number(last) >= 24 * 60 * 60 * 1000;
}

export function rewardShare() {
  if (!canRewardShare()) return false;
  localStorage.setItem(LAST_SHARE_KEY, String(Date.now()));
  addCipherCoin(2, "share");
  return true;
}

/* ===== DAILY LOGIN REWARD ===== */

export function canRewardDaily() {
  const last = localStorage.getItem(LAST_DAILY_KEY);
  if (!last) return true;
  return Date.now() - Number(last) >= 24 * 60 * 60 * 1000;
}

export function rewardDaily() {
  if (!canRewardDaily()) return false;
  localStorage.setItem(LAST_DAILY_KEY, String(Date.now()));
  addCipherCoin(1, "daily");
  return true;
}
