// cipher_os/runtime/contextPrioritizer.js
// Phase upgrade → REAL gravity system

export function prioritizeContext(nodes = [], limit = 15) {
  if (!Array.isArray(nodes)) return [];

  const scored = nodes.map((n) => {
    let score = 0;

    // 🧠 IMPORTANCE
    score += (Number(n.importance) || 0) * 5;

    // 💪 REINFORCEMENT
    score += (Number(n.reinforcementCount) || 0) * 2;

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

  return scored.slice(0, limit);
}
