// cipher_core/stability.js
// Stability Engine 10.1 — Tone-directive, non-therapeutic

export async function getStabilityScore(memoryContext = {}) {
  const messages = memoryContext.history || memoryContext.memories || [];

  // --------------------------
  // DEFAULT BASELINE
  // --------------------------
  let score = 8;
  let tone = "grounded, confident, clear-headed";
  let notes = "Stable baseline.";

  if (!Array.isArray(messages) || messages.length === 0) {
    return { score, tone, notes };
  }

  const last = messages[messages.length - 1];
  const msg = String(last.userMessage || last.content || "")
    .toLowerCase()
    .trim();

  // --------------------------
  // LOW-ENERGY / DISTRESS
  // --------------------------
  if (
    msg.includes("hopeless") ||
    msg.includes("give up") ||
    msg.includes("can't do this")
  ) {
    score = 3;
    tone = "calm, steady, minimal, grounding";
    notes =
      "User may be emotionally low. Respond with clarity and presence, not reassurance.";
  }

  // --------------------------
  // FRUSTRATION / ANGER
  // --------------------------
  else if (
    msg.includes("angry") ||
    msg.includes("pissed") ||
    msg.includes("furious") ||
    msg.includes("this is stupid") ||
    msg.includes("broken")
  ) {
    score = 5;
    tone = "direct, composed, firm but not harsh";
    notes =
      "User frustrated. Cut through noise. Do not soften or placate.";
  }

  // --------------------------
  // STRESS / OVERLOAD
  // --------------------------
  else if (
    msg.includes("stressed") ||
    msg.includes("overwhelmed") ||
    msg.includes("too much")
  ) {
    score = 6;
    tone = "clear, structured, simplifying";
    notes =
      "User overloaded. Organize thoughts and reduce complexity.";
  }

  // --------------------------
  // HIGH CLARITY / MOMENTUM
  // --------------------------
  else if (
    msg.includes("let's do this") ||
    msg.includes("ready") ||
    msg.includes("moving forward") ||
    msg.includes("lock it in")
  ) {
    score = 9;
    tone = "focused, decisive, energetic";
    notes =
      "User has momentum. Match pace and sharpen execution.";
  }

  return { score, tone, notes };
}
