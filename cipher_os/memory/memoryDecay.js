// cipher_os/memory/memoryDecay.js
// Automatic importance decay

import { loadMemoryNodes, writeMemoryNode } from "./memoryGraph.js";

const PROTECTED_TYPES = ["identity"];
const PROTECTED_IMPORTANCE = ["core"];

const IMPORTANCE_ORDER = ["low", "medium", "high", "core"];

function downgrade(level = "low") {
  const i = IMPORTANCE_ORDER.indexOf(level);
  if (i <= 0) return "low";
  return IMPORTANCE_ORDER[i - 1];
}

export async function runMemoryDecay(userId) {
  const nodes = await loadMemoryNodes(userId, 200);

  let decayed = 0;

  for (const n of nodes) {
    if (PROTECTED_TYPES.includes(n.type)) continue;
    if (PROTECTED_IMPORTANCE.includes(n.importance)) continue;

    const last = n.lastReinforcedAt || 0;
    const ageMs = Date.now() - last;

    // If older than 7 days → decay
    if (ageMs > 7 * 24 * 60 * 60 * 1000) {
      const next = downgrade(n.importance);

      if (next !== n.importance) {
        await writeMemoryNode(userId, {
          ...n,
          importance: next,
        });

        decayed++;
      }
    }
  }

  console.log("🍂 memory decay:", decayed);
  return { decayed };
}
