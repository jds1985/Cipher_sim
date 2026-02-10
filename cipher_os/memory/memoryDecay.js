// cipher_os/memory/memoryDecay.js
// Memory decay system with LOCK protection

import { loadMemoryNodes, updateMemoryNode } from "./memoryGraph.js";

/*
  Rules:
  - locked memories NEVER decay
  - others slowly reduce reinforcement
*/

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

    const current = node.reinforcementCount || 0;
    if (current <= 0) continue;

    await updateMemoryNode(userId, node.id, {
      reinforcementCount: current - 1,
    });

    decayed++;
  }

  console.log("🍂 memory decay:", decayed, "| locked:", skipped);

  return { decayed, skipped };
}
