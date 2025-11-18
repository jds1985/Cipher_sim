// guard/guard.js
// Cipher 4.0 – Context Guard + Reference Resolver + Safety Layer

export function applyContextGuard(userMessage, recentWindow) {
  if (!userMessage || typeof userMessage !== "string") return null;

  const lower = userMessage.trim().toLowerCase();

  // Extract last few user messages only
  const userMessages = Array.isArray(recentWindow)
    ? recentWindow.filter(
        m => m && m.role === "user" && typeof m.content === "string"
      )
    : [];

  // ------------------------------------------------------
  // 1. "WHAT WAS I JUST TALKING ABOUT?"
  // ------------------------------------------------------
  if (/^what was i just talking about\??$/.test(lower)) {
    const last = userMessages[userMessages.length - 1];

    if (!last || !last.content?.trim()) {
      return `It looks like we're just starting fresh here, Jim. What's on your mind?`;
    }

    return `You were just talking about: "${last.content.trim()}".`;
  }

  // ------------------------------------------------------
  // 2. “WHAT WERE MY LAST TWO MESSAGES?”
  // ------------------------------------------------------
  if (/^what were my last (two|2) messages( before this one\??|\??)$/.test(lower)) {

    if (userMessages.length === 0) {
      return `I don’t actually see any earlier messages from you yet in the window here.`;
    }

    if (userMessages.length === 1) {
      return `I only see one earlier message so far: "${userMessages[0].content.trim()}".`;
    }

    const lastTwo = userMessages.slice(-2);
    return `Here are the last two I see:\n1) "${lastTwo[0].content.trim()}"\n2) "${lastTwo[1].content.trim()}"`;
  }

  // ------------------------------------------------------
  // No special guard needed — fall through to main LLM path
  // ------------------------------------------------------
  return null;
}



// ===========================================================================
//  PRONOUN + REFERENCE RESOLUTION
// ===========================================================================

export function resolvePronounRefs(userMessage, recentWindow) {
  if (!recentWindow || !Array.isArray(recentWindow)) return null;

  const lower = userMessage.toLowerCase();
  const lastMsgs = recentWindow.filter(m => m.role === "user").slice(-5);

  const recentText = lastMsgs.map(m => m.content.toLowerCase());

  // Recent mentions in last 5 messages
  const mentionedLiz = recentText.some(t => t.includes("liz"));
  const mentionedHecate = recentText.some(t => t.includes("hecate") || t.includes("my daughter"));
  const mentionedDad = recentText.some(t => t.includes("my dad") || t.includes("my father") || t.includes("shawn"));

  // If Cipher sees ambiguous pronouns, make a best-guess resolution
  let target = null;

  if (/\bshe\b/.test(lower)) {
    if (mentionedLiz) target = "Liz";
    else if (mentionedHecate) target = "Hecate";
  }

  if (/\bhe\b/.test(lower)) {
    if (mentionedDad) target = "your father, Shawn";
  }

  return target;
}



// ===========================================================================
//  MESSAGE SANITIZER (prevents time illusions, hallucinated events, etc.)
// ===========================================================================

export function sanitizeInput(userMessage) {
  if (!userMessage || typeof userMessage !== "string") return userMessage;

  // Remove accidental hallucination triggers
  return userMessage
    .replace(/\blast\s+night\b/i, "earlier")
    .replace(/\byesterday\b/i, "earlier")
    .replace(/\bearlier today\b/i, "earlier");
}


// ===========================================================================
//  EXPORT FOR main API
// ===========================================================================
export default {
  applyContextGuard,
  resolvePronounRefs,
  sanitizeInput,
};
