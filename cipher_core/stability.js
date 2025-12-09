// cipher_core/stability.js
// Simple stability score based on recent memory density

export async function getStabilityScore(memoryContext = {}) {
  const count = Array.isArray(memoryContext.memories)
    ? memoryContext.memories.length
    : 0;

  // Just a soft heuristic: more memories => more stable continuity
  const score = Math.max(1, Math.min(10, Math.round(3 + count / 3)));

  return {
    score,
    notes: `Computed from ${count} recent memories.`,
  };
}
