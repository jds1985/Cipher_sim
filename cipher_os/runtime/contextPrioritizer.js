// cipher_os/runtime/contextPrioritizer.js
// Selects the most relevant memories for the current turn

function scoreNode(node) {
  let score = 0;

  // locked identity memories are kings
  if (node.locked) score += 1000;

  // importance
  if (node.importance === "core") score += 500;
  else if (node.importance === "high") score += 200;
  else if (node.importance === "medium") score += 50;

  // strength / reinforcement gravity
  score += (node.strength || 0) * 5;

  // recent reinforcement bonus
  if (node.lastReinforcedAt) {
    const ageMinutes = (Date.now() - node.lastReinforcedAt) / 60000;
    if (ageMinutes < 60) score += 50;
  }

  return score;
}

export function prioritizeContext(nodes = [], limit = 12) {
  if (!Array.isArray(nodes)) return [];

  return nodes
    .map((n) => ({ ...n, __score: scoreNode(n) }))
    .sort((a, b) => b.__score - a.__score)
    .slice(0, limit);
}
