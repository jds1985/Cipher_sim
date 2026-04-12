// cipher_os/memory/memoryDecay.js
// Memory decay system with LOCK + USAGE protection (v3)

import { loadMemoryNodes, updateMemoryNode } from "./memoryGraph.js";

export async function runMemoryDecay(userId) {
  const nodes = await loadMemoryNodes(userId, 500);

  let decayed = 0;
  let skipped = 0;

  const now = Date.now();

  for (const node of nodes) {
    // 🛡 LOCK = NEVER TOUCH
    if (node.locked) {
      skipped++;
      continue;
    }

    const strength = Number(node.strength ?? node.weight ?? 0);
    const reinf = Number(node.reinforcementCount ?? 0);
    const usage = Number(node.usageCount ?? 0);

    const lastUsed = node.lastAccessed || node.lastReinforcedAt || 0;
    const age = now - lastUsed;

    // ⏱ TIME WINDOWS (tweakable)
    const VERY_RECENT = 1000 * 60 * 10;     // 10 min
    const RECENT = 1000 * 60 * 60;          // 1 hour

    // 🚫 skip very recent memories completely
    if (age < VERY_RECENT) {
      skipped++;
      continue;
    }

    // 🧠 USAGE PROTECTION (high-value memories decay slower)
    let decayAmount = 1;

    if (usage > 20) decayAmount = 0;        // basically permanent
    else if (usage > 10) decayAmount = 0.25;
    else if (usage > 5) decayAmount = 0.5;

    // 🧠 reinforcement also slows decay
    if (reinf > 10) decayAmount *= 0.5;

    // nothing to decay
    if (strength <= 0 && reinf <= 0) continue;

    const nextStrength = Math.max(0, strength - decayAmount);
    const nextReinf = Math.max(0, reinf - decayAmount);

    await updateMemoryNode(userId, node.id, {
      strength: nextStrength,
      weight: nextStrength,
      reinforcementCount: nextReinf,
    });

    decayed++;
  }

  console.log("🍂 memory decay:", decayed, "| skipped:", skipped);
  return { decayed, skipped };
}
