// cipher_os/memory/memoryDecay.js
// Memory decay system with LOCK protection (v2)
// Fixes:
// - uses updateMemoryNode (now exported)
// - decays strength/weight AND reinforcementCount
// - locked nodes never decay

import { loadMemoryNodes, updateMemoryNode } from "./memoryGraph.js";

export async function runMemoryDecay(userId) {
  const nodes = await loadMemoryNodes(userId, 500);

  let decayed = 0;
  let skipped = 0;

  for (const node of nodes) {
    if (node.locked) {
      skipped++;
      continue;
    }

    const strength = Number(node.strength ?? node.weight ?? 0);
    const reinf = Number(node.reinforcementCount ?? 0);

    // nothing to decay
    if (strength <= 0 && reinf <= 0) continue;

    const nextStrength = Math.max(0, strength - 1);
    const nextReinf = Math.max(0, reinf - 1);

    await updateMemoryNode(userId, node.id, {
      strength: nextStrength,
      weight: nextStrength,
      reinforcementCount: nextReinf,
    });

    decayed++;
  }

  console.log("🍂 memory decay:", decayed, "| locked:", skipped);
  return { decayed, skipped };
}
