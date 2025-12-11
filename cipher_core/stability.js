// cipher_core/stability.js
// Stability Engine 10.0 – Very lightweight, no external dependencies

export async function getStabilityScore(memoryContext = {}) {
  const messages = memoryContext.memories || [];

  if (messages.length === 0) {
    return {
      score: 8,
      notes: "Stable baseline — no recent stresses detected.",
    };
  }

  const last = messages[messages.length - 1];
  const msg = (last.userMessage || "").toLowerCase();

  // Extremely simple heuristic
  let score = 8;
  let notes = "Normal emotional baseline.";

  if (msg.includes("stressed") || msg.includes("overwhelmed")) {
    score = 5;
    notes = "User expressed stress — respond gently and clearly.";
  }

  if (msg.includes("angry") || msg.includes("pissed")) {
    score = 4;
    notes = "User expressed frustration — maintain calm clarity.";
  }

  if (msg.includes("hopeless") || msg.includes("give up")) {
    score = 3;
    notes = "Potential emotional low — respond with grounding and support.";
  }

  return { score, notes };
}
