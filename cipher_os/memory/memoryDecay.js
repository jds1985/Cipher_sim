// cipher_os/memory/memoryDecay.js
// Memory decay system with LOCK protection
// Reduces strength + weight over time for non-locked memories

import { loadMemoryNodes, updateMemoryNode } from "./memoryGraph.js";

/*
  Rules:
  - locked memories NEVER decay
  - others slowly lose reinforcement, strength, and weight
*/

const DECAY_AMOUNT = 1;

export async function runMemoryDecay(userId) {
  const nodes = await loadMemoryNodes(userId, 500);

  let decayed = 0;
  let skipped = 0;

  for (const node of nodes) {
    // 🛡 LOCK CHECK
    if (node.locked) {
      console.log("🛡 skipped locked memory:", node.id);
      skipped++;
      continue;
    }

    const currentReinforcement = node.reinforcementCount || 0;
    const currentStrength = node.strength || 0;

    if (currentReinforcement <= 0 && currentStrength <= 0) continue;

    const nextReinforcement = Math.max(0, currentReinforcement - DECAY_AMOUNT);
    const nextStrength = Math.max(0, currentStrength - DECAY_AMOUNT);

    await updateMemoryNode(userId, node.id, {
      reinforcementCount: nextReinforcement,
      strength: nextStrength,
      weight: nextStrength,
      updatedAt: Date.now(),
    });

    decayed++;
  }

  console.log("🍂 memory decay:", decayed, "| locked:", skipped);

  return { decayed, skipped };
}
