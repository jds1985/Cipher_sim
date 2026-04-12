// cipher_os/runtime/contextPrioritizer.js
// Phase upgrade → REAL gravity system + usage reinforcement

import { bumpMemoryNode } from "../memory/memoryGraph.js";

export function prioritizeContext(nodes = [], limit = 15) {
  if (!Array.isArray(nodes)) return [];

  const scored = nodes.map((n) => {
    let score = 0;

    // 🧠 IMPORTANCE
    score += (Number(n.importance) || 0) * 5;

    // 💪 REINFORCEMENT
    score += (Number(n.reinforcementCount) || 0) * 2;

    // 🔁 USAGE (NEW SIGNAL)
    score += (Number(n.usageCount) || 0) * 3;

    // 🛡 LOCK = GOD MODE
    if (n.locked) score += 1000;

    // ⏱ RECENCY BOOST
    if (n.lastAccessed) {
      const age = Date.now() - n.lastAccessed;
      const freshness = Math.max(0, 100000000 - age) / 100000000;
      score += freshness * 5;
    }

    return { ...n, _score: score };
  });

  scored.sort((a, b) => b._score - a._score);

  const selected = scored.slice(0, limit);

  // 🔥 REINFORCE ON USAGE (THE MISSING LOOP)
  for (const n of selected) {
    try {
      // skip locked identity spam (safety)
      if (n.locked && n.lockType === "identity") continue;

      bumpMemoryNode(n.userId || n.uid || "unknown", n.id, {
        usageCount: (n.usageCount || 0) + 1,
        lastAccessed: Date.now(),
      });
    } catch (err) {
      console.warn("⚠️ usage reinforcement failed:", err);
    }
  }

  return selected;
}
