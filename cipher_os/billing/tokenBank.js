// cipher_os/billing/tokenBank.js
// Simple monthly token bank for Cipher OS launch

const MONTH = 1000 * 60 * 60 * 24 * 30;

const TIER_LIMITS = {
  free: 50_000,
  pro: 500_000,
  builder: 2_000_000,
};

const userBanks = new Map();

function freshBank(tier = "free") {
  return {
    tier,
    limit: TIER_LIMITS[tier] || TIER_LIMITS.free,
    used: 0,
    resetAt: Date.now() + MONTH,
  };
}

export function getTokenBank(userId, tier = "free") {
  let bank = userBanks.get(userId);

  if (!bank) {
    bank = freshBank(tier);
    userBanks.set(userId, bank);
    return bank;
  }

  // monthly reset
  if (Date.now() > bank.resetAt) {
    bank = freshBank(bank.tier);
    userBanks.set(userId, bank);
  }

  return bank;
}

export function canSpend(userId, tokensNeeded, tier = "free") {
  const bank = getTokenBank(userId, tier);
  return bank.used + tokensNeeded <= bank.limit;
}

export function spendTokens(userId, tokensSpent, tier = "free") {
  const bank = getTokenBank(userId, tier);
  bank.used += tokensSpent;
  userBanks.set(userId, bank);
  return bank;
}

export function getRemaining(userId, tier = "free") {
  const bank = getTokenBank(userId, tier);
  return bank.limit - bank.used;
}
