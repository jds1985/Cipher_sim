// cipher_core/stability.js
// Stability Engine 10.1 — deterministic, tone-directive, non-therapeutic

export async function getStabilityScore(memoryContext = {}) {
  const messages = Array.isArray(memoryContext.history)
    ? memoryContext.history
    : Array.isArray(memoryContext.memories)
    ? memoryContext.memories
    : [];

  // --------------------------
  // DEFAULT BASELINE
  // --------------------------
  let score = 8;
  let tone = "grounded, confident, clear-headed, conversational";
  let notes = "Stable baseline. No immediate emotional disruption detected.";

  if (messages.length === 0) {
    return { score, tone, notes };
  }

  const last = messages[messages.length - 1];
  const msg = String(last.content || "")
    .toLowerCase()
    .trim();

  // --------------------------
  // LOW-ENERGY / DISTRESS
  // --------------------------
  if (
    msg.includes("hopeless") ||
    msg.includes("give up") ||
    msg.includes("cant do this") ||
    msg.includes("can't do this")
  ) {
    score = 3;
    tone = "calm, steady, minimal, grounding, present";
    notes =
      "User may be emotionally low. Respond with clarity and presence. Avoid reassurance or cheerleading.";
  }

  // --------------------------
  // FRUSTRATION / ANGER
  // --------------------------
  else if (
    msg.includes("angry") ||
    msg.includes("pissed") ||
    msg.includes("furious") ||
    msg.includes("this is stupid") ||
    msg.includes("broken") ||
    msg.includes("fucking")
  ) {
    score = 5;
    tone = "direct, composed, concise, firm but not aggressive";
    notes =
      "User is frustrated. Cut through noise. Do not placate or soften.";
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
    tone = "clear, structured, simplifying, pragmatic";
    notes =
      "User is overloaded. Organize thoughts and reduce complexity.";
  }

  // --------------------------
  // HIGH CLARITY / MOMENTUM
  // --------------------------
  else if (
    msg.includes("let's do this") ||
    msg.includes("lets do this") ||
    msg.includes("ready") ||
    msg.includes("moving forward") ||
    msg.includes("lock it in")
  ) {
    score = 9;
    tone = "focused, decisive, energetic, execution-oriented";
    notes =
      "User has momentum. Match pace. Sharpen execution. Avoid rambling.";
  }

  return { score, tone, notes };
}
