import fs from "fs";
import path from "path";

const statsPath = path.join(process.cwd(), "cipher_os/autonomy/sivaStats.json");

function readStats() {
  try {
    const raw = fs.readFileSync(statsPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {
      level: 0,
      successes: 0,
      failures: 0,
      promotionEligible: false,
    };
  }
}

function writeStats(stats) {
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
}

export async function updateSivaScore({ success }) {
  const stats = readStats();

  if (success) stats.successes++;
  else stats.failures++;

  const attempts = stats.successes + stats.failures;
  const confidence = attempts === 0 ? 0 : stats.successes / attempts;

  // baby threshold, adjustable later
  if (attempts >= 20 && confidence >= 0.7) {
    stats.promotionEligible = true;
  }

  writeStats(stats);

  return {
    attempts,
    confidence,
    promotionEligible: stats.promotionEligible,
  };
}
